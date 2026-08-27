import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { getAbilityModifier, isCharacterDead, getEffectiveMaxHp } from '../../utils/dndCalculations';
import { Flame, Moon, Heart, Sparkles, Wand2, X, RefreshCw, Dices } from 'lucide-react';

interface RestModalProps {
  character: CharacterData;
  onClose: () => void;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  initialRestType?: 'short' | 'long';
}

export const RestModal: React.FC<RestModalProps> = ({
  character,
  onClose,
  onUpdateCharacter,
  onRoll,
  initialRestType = 'short'
}) => {
  const [restType, setRestType] = useState<'short' | 'long'>(initialRestType);
  const [diceToSpend, setDiceToSpend] = useState<number>(1);
  const [applySpellRecovery, setApplySpellRecovery] = useState<boolean>(true);
  const [restLog, setRestLog] = useState<string | null>(null);

  const effectiveMaxHp = getEffectiveMaxHp(character);

  // Parse Hit Die string (e.g. "5d10" -> count: 5, sides: 10)
  const hitDieMatch = character.hitDiceTotal.match(/(\d+)d(\d+)/i);
  const maxHitDice = hitDieMatch ? parseInt(hitDieMatch[1]) : character.level;
  const dieSides = hitDieMatch ? parseInt(hitDieMatch[2]) : 8;

  const conScore = character.abilities?.CON?.score ?? 10;
  const conMod = Math.floor((conScore - 10) / 2);

  // Execute Short Rest
  const handlePerformShortRest = () => {
    if (isCharacterDead(character)) {
      setRestLog(`💀 ${character.name} is DEAD! Resting cannot restore HP or bring a dead character back to life.`);
      return;
    }

    if (character.hitDiceCurrent <= 0) {
      setRestLog('No Hit Dice remaining! Take a Long Rest to recover Hit Dice.');
      return;
    }

    const countToSpend = Math.min(diceToSpend, character.hitDiceCurrent);
    let totalHpRecovered = 0;
    const rolls: number[] = [];

    for (let i = 0; i < countToSpend; i++) {
      const roll = Math.floor(Math.random() * dieSides) + 1;
      rolls.push(roll);
      totalHpRecovered += Math.max(1, roll + conMod); // min 1 HP per die
    }

    const newHp = Math.min(effectiveMaxHp, character.hpCurrent + totalHpRecovered);
    const newHitDice = Math.max(0, character.hitDiceCurrent - countToSpend);

    // Reset Short Rest Features
    const updatedFeatures = character.classFeatures.map(feat => {
      if (feat.recharge === 'Short Rest' && feat.usesMax) {
        return { ...feat, usesRemaining: feat.usesMax };
      }
      return feat;
    });

    // Short Rest Spell Slot Recovery (Warlock Pact Magic & Arcane / Natural Recovery)
    let updatedSpellSlots = [...(character.spellSlots || [])];
    let spellRecoveryLog = '';

    const isWarlock = (character.characterClass || '').toLowerCase().includes('warlock');
    const isWizardOrDruid = ['wizard', 'druid', 'sorcerer'].some(c => (character.characterClass || '').toLowerCase().includes(c));

    if (isWarlock) {
      updatedSpellSlots = updatedSpellSlots.map(slot => ({ ...slot, current: slot.max }));
      spellRecoveryLog = ' Warlock Pact Magic slots fully restored!';
    } else if (applySpellRecovery && isWizardOrDruid) {
      const maxSlotsToRecover = Math.max(1, Math.ceil(character.level / 2));
      let recoveredCount = 0;
      updatedSpellSlots = updatedSpellSlots.map(slot => {
        if (slot.level > 0 && slot.current < slot.max && recoveredCount < maxSlotsToRecover) {
          const needed = slot.max - slot.current;
          const toAdd = Math.min(needed, maxSlotsToRecover - recoveredCount);
          recoveredCount += toAdd;
          return { ...slot, current: slot.current + toAdd };
        }
        return slot;
      });
      if (recoveredCount > 0) {
        spellRecoveryLog = ` Arcane/Natural Recovery restored +${recoveredCount} spell slot(s)!`;
      }
    }

    let conditions = character.conditions || [];
    let deathSavesSuccesses = character.deathSavesSuccesses || 0;
    let deathSavesFailures = character.deathSavesFailures || 0;

    if (character.hpCurrent <= 0 && newHp > 0) {
      conditions = conditions.filter(c => c !== 'Unconscious');
      deathSavesSuccesses = 0;
      deathSavesFailures = 0;
    }

    onUpdateCharacter({
      ...character,
      hpCurrent: newHp,
      hitDiceCurrent: newHitDice,
      spellSlots: updatedSpellSlots,
      classFeatures: updatedFeatures,
      conditions,
      deathSavesSuccesses,
      deathSavesFailures
    });

    if (onRoll) {
      onRoll(`Short Rest Healing (${countToSpend}d${dieSides} + ${countToSpend * conMod} CON)`, dieSides, countToSpend, countToSpend * conMod, 'normal');
    }

    setRestLog(`Short Rest Completed! Spent ${countToSpend} Hit Die (${rolls.join(', ')} + CON) restoring +${totalHpRecovered} HP! Short Rest class features recharged.${spellRecoveryLog}`);
  };

  // Execute Long Rest
  const handlePerformLongRest = () => {
    if (isCharacterDead(character)) {
      setRestLog(`💀 ${character.name} is DEAD! Resting cannot restore HP or bring a dead character back to life. Requires Revivify, Resurrection, or manual HP edit.`);
      return;
    }

    // Recover all HP up to effective Max HP
    const newHp = effectiveMaxHp;

    // Recover Hit Dice (up to half total or full max)
    const recoveredHdCount = Math.max(1, Math.floor(maxHitDice / 2));
    const newHitDice = Math.min(maxHitDice, character.hitDiceCurrent + recoveredHdCount);

    // Recover Spell Slots
    const updatedSpellSlots = character.spellSlots.map(slot => ({
      ...slot,
      current: slot.max
    }));

    // Recharge Class Features (Short & Long Rest)
    const updatedFeatures = character.classFeatures.map(feat => {
      if ((feat.recharge === 'Short Rest' || feat.recharge === 'Long Rest') && feat.usesMax) {
        return { ...feat, usesRemaining: feat.usesMax };
      }
      return feat;
    });

    // Reduce Exhaustion by 1 if present
    const newExhaustion = Math.max(0, (character.exhaustionLevel || 0) - 1);
    const conditions = (character.conditions || []).filter(c => c !== 'Unconscious');

    onUpdateCharacter({
      ...character,
      hpCurrent: newHp,
      hpTemp: 0,
      hitDiceCurrent: newHitDice,
      spellSlots: updatedSpellSlots,
      classFeatures: updatedFeatures,
      deathSavesSuccesses: 0,
      deathSavesFailures: 0,
      exhaustionLevel: newExhaustion,
      conditions
    });

    setRestLog(`Long Rest Completed! Fully restored HP (${newHp}/${newHp}), recharged Spell Slots, reset Death Saves, recovered +${recoveredHdCount} Hit Dice, and reduced Exhaustion.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-serif font-bold text-stone-100">Nexus Rest & Recovery Engine</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1.5 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={() => { setRestType('short'); setRestLog(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              restType === 'short'
                ? 'bg-amber-600 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Short Rest (1 Hour)</span>
          </button>

          <button
            type="button"
            onClick={() => { setRestType('long'); setRestLog(null); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              restType === 'long'
                ? 'bg-indigo-600 text-stone-100 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Long Rest (8 Hours)</span>
          </button>
        </div>

        {/* Short Rest Panel */}
        {restType === 'short' && (
          <div className="space-y-4">
            <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span>Hit Die Type: <strong className="text-amber-300">d{dieSides}</strong></span>
                <span>CON Modifier: <strong className="text-emerald-400">{conMod >= 0 ? `+${conMod}` : conMod}</strong></span>
              </div>
              <div className="flex justify-between items-center text-stone-300">
                <span>Current HP: <strong className="text-rose-400">{character.hpCurrent} / {effectiveMaxHp}</strong></span>
                <span>Hit Dice Left: <strong className="text-amber-400">{character.hitDiceCurrent} / {maxHitDice}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-300">
                Hit Dice to Spend:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, character.hitDiceCurrent)}
                  value={diceToSpend}
                  onChange={(e) => setDiceToSpend(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono text-center text-sm font-bold"
                />
                <button
                  onClick={() => setDiceToSpend(character.hitDiceCurrent)}
                  className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-2 rounded-xl transition font-mono"
                >
                  Spend All ({character.hitDiceCurrent})
                </button>
              </div>
            </div>

            {/* Class Spell Recovery Indicator */}
            {['warlock', 'wizard', 'druid', 'sorcerer'].some(c => (character.characterClass || '').toLowerCase().includes(c)) && (
              <label className="flex items-center gap-2 p-2 bg-purple-950/40 border border-purple-800/50 rounded-xl cursor-pointer text-xs text-purple-200 font-semibold">
                <input
                  type="checkbox"
                  checked={applySpellRecovery}
                  onChange={(e) => setApplySpellRecovery(e.target.checked)}
                  className="w-4 h-4 rounded bg-stone-900 border-stone-700 text-purple-500 focus:ring-purple-500"
                />
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  {(character.characterClass || '').toLowerCase().includes('warlock')
                    ? 'Restore Warlock Pact Magic Spell Slots'
                    : 'Apply Arcane / Natural Recovery (+ Spell Slots)'}
                </span>
              </label>
            )}

            <button
              onClick={handlePerformShortRest}
              disabled={character.hitDiceCurrent <= 0}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Dices className="w-4 h-4" />
              <span>Spend {diceToSpend} Hit Die & Recover HP</span>
            </button>
          </div>
        )}

        {/* Long Rest Panel */}
        {restType === 'long' && (
          <div className="space-y-4">
            <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2 text-xs text-stone-300">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Long Rest Benefits (8 Hours):
              </div>
              <ul className="list-disc list-inside space-y-1 text-stone-300 text-[11px]">
                <li>Restore HP to maximum (<strong className="text-rose-400">{effectiveMaxHp} HP</strong>).</li>
                <li>Restore Hit Dice count by +{Math.max(1, Math.floor(maxHitDice / 2))} (up to {maxHitDice}).</li>
                <li>Fully restore all Spell Slots & Class Feature charges.</li>
                <li>Reset Death Save successes/failures and clear 1 Exhaustion level.</li>
              </ul>
            </div>

            <button
              onClick={handlePerformLongRest}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-stone-100 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Moon className="w-4 h-4" />
              <span>Perform Full Long Rest</span>
            </button>
          </div>
        )}

        {/* Result Log */}
        {restLog && (
          <div className="bg-stone-950 border border-amber-600/40 p-3 rounded-xl text-xs text-amber-200 font-sans leading-relaxed">
            {restLog}
          </div>
        )}

        <div className="pt-2 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs px-4 py-2 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
