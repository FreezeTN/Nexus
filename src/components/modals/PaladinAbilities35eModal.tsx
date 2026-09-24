import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { calculate35ePaladinStats } from '../../utils/calculators/classFeatures35eCalculators';
import { Shield, Sparkles, Heart, Crosshair, X, Sun, AlertCircle } from 'lucide-react';
import { playDiceSound } from '../../utils/soundEffects';

interface PaladinAbilities35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (char: CharacterData) => void;
  onClose: () => void;
  onRoll?: (diceNotation: string, label: string) => void;
}

export const PaladinAbilities35eModal: React.FC<PaladinAbilities35eModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose,
  onRoll
}) => {
  if (!isOpen) return null;

  const stats = calculate35ePaladinStats(character);
  const [activeTab, setActiveTab] = useState<'smite' | 'lay_on_hands' | 'passives'>('smite');
  const [healAmount, setHealAmount] = useState<number>(Math.min(10, stats.layOnHandsPoolRemaining));
  const [targetType, setTargetType] = useState<'living' | 'undead'>('living');
  const [logMessage, setLogMessage] = useState<string | null>(null);

  // Smite Evil roll
  const handleSmiteEvil = () => {
    if (stats.smiteEvilUsesRemaining <= 0) {
      setLogMessage('⚠️ No Smite Evil uses remaining today!');
      return;
    }

    // Roll d20 + BAB + STR/DEX + CHA mod
    const d20 = Math.floor(Math.random() * 20) + 1;
    const baseAtk = character.baseAttackBonus || character.bab || character.level || 1;
    const totalAtk = d20 + baseAtk + stats.smiteAttackBonus;

    const newRemaining = Math.max(0, stats.smiteEvilUsesRemaining - 1);
    onUpdateCharacter({
      ...character,
      smiteEvilUsesRemaining: newRemaining
    });

    playDiceSound();
    if (onRoll) {
      onRoll(`1d20+${baseAtk + stats.smiteAttackBonus}`, 'Smite Evil Attack Roll');
    }
    setLogMessage(`⚔️ SMITE EVIL invoked! Attack Roll: [d20 (${d20}) + BAB (${baseAtk}) + CHA (+${stats.smiteAttackBonus})] = ${totalAtk}. Bonus Damage: +${stats.smiteDamageBonus} if target is Evil! (${newRemaining}/${stats.smiteEvilUsesMax} smites left).`);
  };

  // Lay on Hands
  const handleLayOnHands = () => {
    if (healAmount <= 0) return;
    if (healAmount > stats.layOnHandsPoolRemaining) {
      setLogMessage('⚠️ Cannot exceed remaining Lay on Hands pool!');
      return;
    }

    const nextRemaining = stats.layOnHandsPoolRemaining - healAmount;

    let nextChar: CharacterData = {
      ...character,
      layOnHandsPoolRemaining: nextRemaining
    };

    playDiceSound();

    if (targetType === 'living') {
      const currentHp = character.hpCurrent || 0;
      const maxHp = character.hpMax || 10;
      const healedHp = Math.min(maxHp, currentHp + healAmount);
      nextChar = {
        ...nextChar,
        hpCurrent: healedHp
      };

      setLogMessage(`✨ Lay on Hands healed for ${healAmount} HP! (Current HP: ${healedHp}/${maxHp} • Remaining pool: ${nextRemaining}/${stats.layOnHandsPoolMax}).`);
    } else {
      // Damage undead via touch attack (no saving throw in 3.5e RAW!)
      const d20 = Math.floor(Math.random() * 20) + 1;
      const baseAtk = character.baseAttackBonus || character.bab || 1;
      const touchAtk = d20 + baseAtk;

      if (onRoll) {
        onRoll(`1d20+${baseAtk}`, 'Melee Touch Attack (Lay on Hands)');
      }
      setLogMessage(`⚡ Unleashed positive energy at Undead! Melee Touch: [d20 (${d20}) + BAB (${baseAtk})] = ${touchAtk}. Deals ${healAmount} positive energy damage with NO save! (Remaining pool: ${nextRemaining}/${stats.layOnHandsPoolMax}).`);
    }

    onUpdateCharacter(nextChar);
  };

  const handleRestoreDaily = () => {
    onUpdateCharacter({
      ...character,
      smiteEvilUsesRemaining: stats.smiteEvilUsesMax,
      layOnHandsPoolRemaining: stats.layOnHandsPoolMax
    });
    setLogMessage(`✨ Restored daily Smite Evil uses (${stats.smiteEvilUsesMax}) and Lay on Hands pool (${stats.layOnHandsPoolMax}).`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-stone-900 border border-amber-600/50 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-400">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-200">
                D&D 3.5e Holy Paladin Suite
              </h2>
              <p className="text-xs text-stone-400">
                PHB p. 42-45 • Level {stats.paladinLevel} Paladin (CHA Mod: +{stats.chaMod})
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 pt-2">
          <button
            onClick={() => setActiveTab('smite')}
            className={`px-4 py-2 text-xs font-bold font-serif transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'smite'
                ? 'border-amber-500 text-amber-300 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" /> Smite Evil
          </button>
          <button
            onClick={() => setActiveTab('lay_on_hands')}
            className={`px-4 py-2 text-xs font-bold font-serif transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'lay_on_hands'
                ? 'border-amber-500 text-amber-300 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" /> Lay on Hands
          </button>
          <button
            onClick={() => setActiveTab('passives')}
            className={`px-4 py-2 text-xs font-bold font-serif transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'passives'
                ? 'border-amber-500 text-amber-300 bg-stone-800/50'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Auras & Grace
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 py-4 overflow-y-auto">
          {logMessage && (
            <div className="p-2.5 bg-amber-950/80 border border-amber-500/50 rounded-xl text-xs text-amber-200">
              {logMessage}
            </div>
          )}

          {activeTab === 'smite' && (
            <div className="space-y-4">
              <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-stone-400 text-xs block">Smite Evil Uses</span>
                  <span className="font-bold text-amber-300 font-mono text-base">
                    {stats.smiteEvilUsesRemaining} / {stats.smiteEvilUsesMax} per day
                  </span>
                </div>
                <button
                  onClick={handleSmiteEvil}
                  disabled={stats.smiteEvilUsesRemaining <= 0}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Crosshair className="w-4 h-4" /> Roll Smite Attack
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-950/50 border border-stone-800 rounded-xl">
                  <span className="text-[10px] text-stone-400 uppercase font-mono block">Attack Bonus</span>
                  <span className="text-xl font-bold text-amber-300 font-mono">+{stats.smiteAttackBonus}</span>
                  <span className="text-[10px] text-stone-500 block">Charisma Modifier</span>
                </div>

                <div className="p-3 bg-stone-950/50 border border-stone-800 rounded-xl">
                  <span className="text-[10px] text-stone-400 uppercase font-mono block">Damage Bonus</span>
                  <span className="text-xl font-bold text-red-400 font-mono">+{stats.smiteDamageBonus}</span>
                  <span className="text-[10px] text-stone-500 block">+1 per Paladin Level</span>
                </div>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-600/40 rounded-xl text-xs text-amber-200/90 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> 3.5e RAW Target Alignment Rule:
                </p>
                <p className="leading-relaxed text-stone-300">
                  If the target is not evil, the smite attack has no effect, and the use is still expended from your daily pool.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'lay_on_hands' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-stone-400 text-xs block">Healing Pool</span>
                  <span className="font-bold text-emerald-400 font-mono text-xl">
                    {stats.layOnHandsPoolRemaining} / {stats.layOnHandsPoolMax} HP
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    (Level {stats.paladinLevel} × max(1, CHA mod {stats.chaMod}))
                  </span>
                </div>

                <button
                  onClick={handleRestoreDaily}
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs transition"
                >
                  Restore Pool
                </button>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('living')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    targetType === 'living'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-stone-950/50 border-stone-800 text-stone-400'
                  }`}
                >
                  <Heart className="w-4 h-4 text-emerald-400" /> Heal Living
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('undead')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    targetType === 'undead'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                      : 'bg-stone-950/50 border-stone-800 text-stone-400'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-400" /> Damage Undead
                </button>
              </div>

              {/* Slider for amount */}
              <div className="p-3.5 bg-stone-950/50 border border-stone-800 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300 font-medium">Channel Amount:</span>
                  <span className="font-bold text-amber-300 font-mono">{healAmount} HP</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, stats.layOnHandsPoolRemaining)}
                  value={healAmount}
                  onChange={(e) => setHealAmount(parseInt(e.target.value) || 1)}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <button
                  onClick={handleLayOnHands}
                  disabled={stats.layOnHandsPoolRemaining <= 0}
                  className="w-full mt-2 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                >
                  {targetType === 'living' ? `Restore ${healAmount} Hit Points` : `Unleash ${healAmount} Damage vs Undead`}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'passives' && (
            <div className="space-y-3">
              <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-200 text-sm block">Divine Grace</span>
                  <span className="text-xs text-stone-400">
                    Add Charisma bonus to all saving throws (Fortitude, Reflex, Will)
                  </span>
                </div>
                <span className="text-base font-bold text-amber-300 font-mono">
                  +{stats.divineGraceBonus}
                </span>
              </div>

              <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-200 text-sm block">Aura of Courage (Lvl 3)</span>
                  <span className="text-xs text-stone-400">
                    Immune to fear; allies within 10 ft gain +4 morale bonus vs fear
                  </span>
                </div>
                <span className="text-xs px-2 py-1 bg-emerald-950 border border-emerald-500/50 text-emerald-300 rounded font-bold">
                  Active
                </span>
              </div>

              {stats.removeDiseaseWeeklyMax > 0 && (
                <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-200 text-sm block">Remove Disease (Lvl 6+)</span>
                    <span className="text-xs text-stone-400">Cure diseases as the spell</span>
                  </div>
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    {stats.removeDiseaseWeeklyMax}/week
                  </span>
                </div>
              )}
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
