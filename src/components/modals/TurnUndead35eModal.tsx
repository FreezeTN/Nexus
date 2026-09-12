import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  get35eTurningStats,
  get35eTurningCheckMaxHd,
  roll35eTurningSequence,
  formatModifier,
  TurningRollResult35e
} from '../../utils/dndCalculations';
import {
  Sun,
  Moon,
  Flame,
  Skull,
  X,
  Dices,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Zap,
  Info
} from 'lucide-react';

interface TurnUndead35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const TurnUndead35eModal: React.FC<TurnUndead35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const stats = get35eTurningStats(character);
  const [variant, setVariant] = useState<'turn' | 'rebuke'>(stats.variant);
  const [levelOverride, setLevelOverride] = useState<number>(stats.effectiveLevel);
  const [hasExtraTurning, setHasExtraTurning] = useState<boolean>(stats.hasExtraTurning);
  const [remainingUses, setRemainingUses] = useState<number>(stats.remainingUses);

  // Target Undead Simulator
  const [targetHd, setTargetHd] = useState<number>(2);
  const [turnResult, setTurnResult] = useState<TurningRollResult35e | null>(null);

  if (!isOpen) return null;

  const maxUses = Math.max(1, 3 + stats.chaMod + (hasExtraTurning ? 4 : 0));

  const handleSpendUse = () => {
    const next = Math.max(0, remainingUses - 1);
    setRemainingUses(next);
    onUpdateCharacter({
      ...character,
      turnUndeadUsesRemaining: next
    });
  };

  const handleRestoreUses = () => {
    setRemainingUses(maxUses);
    onUpdateCharacter({
      ...character,
      turnUndeadUsesRemaining: maxUses
    });
  };

  const handleRollTurn = () => {
    const charWithOverrides: CharacterData = {
      ...character,
      turnUndeadLevelOverride: levelOverride,
      turnUndeadVariant: variant,
      hasExtraTurning
    };
    const res = roll35eTurningSequence(charWithOverrides);
    setTurnResult(res);

    // Auto-spend 1 use if available
    if (remainingUses > 0) {
      handleSpendUse();
    }

    if (onRoll) {
      const verb = variant === 'turn' ? 'Turn Undead' : 'Rebuke Undead';
      onRoll(
        `${verb} Check (1d20+${res.checkBonus})`,
        20,
        1,
        res.checkBonus,
        'normal'
      );
      onRoll(
        `${verb} Damage (${res.damageDice[0]}+${res.damageDice[1]} + ${res.damageBonus}) = ${res.totalDamageHd} HD Total`,
        6,
        2,
        res.damageBonus,
        'normal'
      );
    }
  };

  const handleSaveSettings = () => {
    onUpdateCharacter({
      ...character,
      turnUndeadLevelOverride: levelOverride,
      turnUndeadVariant: variant,
      hasExtraTurning,
      turnUndeadUsesRemaining: remainingUses,
      turnUndeadUsesMax: maxUses
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              variant === 'turn'
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                : 'bg-purple-950/70 border-purple-500/50 text-purple-300'
            }`}>
              {variant === 'turn' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-200 flex items-center gap-2">
                <span>D&D 3.5e {variant === 'turn' ? 'Turn Undead' : 'Rebuke Undead'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
                  PHB p. 159
                </span>
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {character.name} &bull; Effective Turning Level {levelOverride}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleSaveSettings();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Quick Metrics Bar & Uses Counter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-sans font-bold block">
                Turning Level
              </span>
              <input
                type="number"
                min="1"
                value={levelOverride}
                onChange={(e) => setLevelOverride(parseInt(e.target.value) || 1)}
                className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-amber-300 font-bold text-sm my-0.5"
                title="Cleric level or Paladin level - 3"
              />
              <span className="text-[9px] text-stone-500 block">Cleric/Pal-3</span>
            </div>

            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-sans font-bold block">
                Check Bonus
              </span>
              <div className="text-base font-bold text-amber-300 my-0.5">
                {formatModifier(stats.chaMod + stats.religionSynergy)}
              </div>
              <span className="text-[9px] text-stone-500 block">
                CHA {formatModifier(stats.chaMod)}
                {stats.religionSynergy > 0 ? ' + Syn 2' : ''}
              </span>
            </div>

            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-sans font-bold block">
                Turn Damage
              </span>
              <div className="text-base font-bold text-amber-300 my-0.5">
                2d6 {formatModifier(levelOverride + stats.chaMod)}
              </div>
              <span className="text-[9px] text-stone-500 block">Total HD affected</span>
            </div>

            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-sans font-bold block">
                Daily Uses
              </span>
              <div className="text-base font-bold text-emerald-400 my-0.5 flex items-center justify-center gap-1">
                <span>{remainingUses}</span>
                <span className="text-stone-500 text-xs">/ {maxUses}</span>
              </div>
              <div className="flex items-center justify-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={handleSpendUse}
                  disabled={remainingUses <= 0}
                  className="px-1.5 py-0.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 rounded text-[9px] text-stone-300"
                >
                  -1 Use
                </button>
                <button
                  type="button"
                  onClick={handleRestoreUses}
                  className="px-1.5 py-0.5 bg-stone-800 hover:bg-stone-700 rounded text-[9px] text-amber-300"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Variant & Feat Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950 p-3 rounded-xl border border-stone-800">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-sans font-bold">Mode:</span>
              <div className="flex rounded-lg overflow-hidden border border-stone-700 p-0.5 bg-stone-900">
                <button
                  type="button"
                  onClick={() => setVariant('turn')}
                  className={`px-3 py-1 rounded font-bold transition flex items-center gap-1 ${
                    variant === 'turn'
                      ? 'bg-amber-600 text-stone-950'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Turn / Destroy
                </button>
                <button
                  type="button"
                  onClick={() => setVariant('rebuke')}
                  className={`px-3 py-1 rounded font-bold transition flex items-center gap-1 ${
                    variant === 'rebuke'
                      ? 'bg-purple-600 text-stone-100'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Rebuke / Command
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-stone-300">
              <input
                type="checkbox"
                checked={hasExtraTurning}
                onChange={(e) => setHasExtraTurning(e.target.checked)}
                className="accent-amber-500 w-4 h-4 rounded"
              />
              <span>Extra Turning Feat (+4 uses/day)</span>
            </label>
          </div>

          {/* Synergy Notice if Active */}
          {stats.religionSynergy > 0 ? (
            <div className="bg-emerald-950/30 border border-emerald-700/40 p-2.5 rounded-xl flex items-center gap-2 text-emerald-300">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                <strong>Knowledge (Religion) Synergy (+2):</strong> You have 5+ ranks in Knowledge (Religion), granting a +2 synergy bonus to turning checks!
              </span>
            </div>
          ) : (
            <div className="text-stone-500 text-[11px] flex items-center gap-1.5 px-1">
              <Info className="w-3.5 h-3.5" />
              <span>Tip: 5 ranks in Knowledge (Religion) grants a permanent +2 synergy bonus on turning checks.</span>
            </div>
          )}

          {/* Target Undead Simulation Config */}
          <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-200 flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-rose-400" />
                Target Undead HD Simulator:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-stone-400">Single Creature HD:</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={targetHd}
                  onChange={(e) => setTargetHd(parseInt(e.target.value) || 1)}
                  className="w-12 bg-stone-900 border border-stone-700 rounded text-center text-amber-300 font-bold p-1"
                />
              </div>
            </div>
            <p className="text-[11px] text-stone-400">
              Common 3.5e Undead: Skeleton (1 HD), Zombie (2 HD), Ghoul (2 HD), Ghast (4 HD), Wight (4 HD), Wraith (5 HD), Mummy (8 HD), Vampire (8+ HD).
            </p>
          </div>

          {/* Active Turning Roll Action Button */}
          <button
            type="button"
            onClick={handleRollTurn}
            className={`w-full py-3 font-serif font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-98 ${
              variant === 'turn'
                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            <Dices className="w-5 h-5" />
            <span>Roll 3.5e {variant === 'turn' ? 'Turn Undead' : 'Rebuke Undead'}</span>
          </button>

          {/* Roll Result Display */}
          {turnResult && (
            <div className="bg-stone-950 p-4 rounded-xl border border-amber-600/50 space-y-3 font-mono animate-in fade-in">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-bold text-amber-300 uppercase tracking-wider text-xs">
                  Turning Outcome
                </span>
                <span className="text-stone-400 text-xs">
                  Turning Check: 1d20 ({turnResult.d20}) {formatModifier(turnResult.checkBonus)} = <strong className="text-white text-sm">{turnResult.checkTotal}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Max HD Affected */}
                <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                  <span className="text-stone-400 text-[10px] block uppercase">
                    Max Creature HD Affected
                  </span>
                  <div className="text-lg font-bold text-amber-300">
                    Up to {turnResult.maxHdCreatureAffected} HD
                  </div>
                  <span className="text-[10px] text-stone-500 block">
                    (Undead with &gt; {turnResult.maxHdCreatureAffected} HD are unaffected)
                  </span>
                </div>

                {/* Total Damage HD Turned */}
                <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                  <span className="text-stone-400 text-[10px] block uppercase">
                    Total Turned Capacity (Damage)
                  </span>
                  <div className="text-lg font-bold text-emerald-300">
                    {turnResult.totalDamageHd} HD Total
                  </div>
                  <span className="text-[10px] text-stone-500 block">
                    Dice: {turnResult.damageDice[0]} + {turnResult.damageDice[1]} + {turnResult.damageBonus}
                  </span>
                </div>
              </div>

              {/* Simulation Outcome against chosen target */}
              {(() => {
                const canAffect = targetHd <= turnResult.maxHdCreatureAffected;
                const countTurned = canAffect ? Math.floor(turnResult.totalDamageHd / targetHd) : 0;
                const isDestroyed = canAffect && targetHd <= turnResult.destroyThresholdHd;

                return (
                  <div className={`p-3 rounded-lg border flex items-center justify-between ${
                    !canAffect
                      ? 'bg-rose-950/30 border-rose-800 text-rose-300'
                      : isDestroyed
                      ? 'bg-amber-950/40 border-amber-600 text-amber-200'
                      : 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                  }`}>
                    <div>
                      <div className="font-bold font-serif text-sm">
                        Against {targetHd} HD Undead:
                      </div>
                      <div className="text-xs">
                        {!canAffect ? (
                          <span>Target HD exceeds maximum affected ({turnResult.maxHdCreatureAffected} HD). No effect!</span>
                        ) : isDestroyed ? (
                          <span>
                            <strong>{countTurned} {targetHd} HD Undead {variant === 'turn' ? 'DESTROYED OUTRIGHT' : 'COMMANDED'}!</strong> (Target HD &le; {turnResult.destroyThresholdHd})
                          </span>
                        ) : (
                          <span>
                            <strong>{countTurned} {targetHd} HD Undead {variant === 'turn' ? 'Flee in Terror' : 'Rebuked/Cowering'}!</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-bold">
                      {isDestroyed ? (
                        <span className="px-2 py-1 bg-amber-500 text-stone-950 rounded text-xs">
                          {variant === 'turn' ? '💥 DESTROYED' : '👑 COMMANDED'}
                        </span>
                      ) : canAffect ? (
                        <span className="px-2 py-1 bg-emerald-700 text-white rounded text-xs">
                          {variant === 'turn' ? '🏃 TURNED' : '😨 REBUKED'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-rose-800 text-white rounded text-xs">
                          ❌ UNAFFECTED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Official 3.5e Turning Table Reference */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5 text-[11px] font-mono">
            <div className="text-stone-400 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Official 3.5e Turning Check Table Reference:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px] text-stone-400 pt-1">
              <div>Check &le; 0: Level - 4</div>
              <div>Check 1-3: Level - 3</div>
              <div>Check 4-6: Level - 2</div>
              <div>Check 7-9: Level - 1</div>
              <div>Check 10-12: Level</div>
              <div>Check 13-15: Level + 1</div>
              <div>Check 16-18: Level + 2</div>
              <div>Check 19-21: Level + 3</div>
              <div>Check &ge; 22: Level + 4</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-stone-800 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              handleSaveSettings();
              onClose();
            }}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
