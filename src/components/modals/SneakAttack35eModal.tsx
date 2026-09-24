import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { calculate35eRogueStats } from '../../utils/calculators/classFeatures35eCalculators';
import { Skull, Crosshair, ShieldCheck, X, AlertTriangle, EyeOff, Zap } from 'lucide-react';
import { playDiceSound } from '../../utils/soundEffects';

interface SneakAttack35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter?: (char: CharacterData) => void;
  onClose: () => void;
  onRoll?: (diceNotation: string, label: string) => void;
}

export const SneakAttack35eModal: React.FC<SneakAttack35eModalProps> = ({
  isOpen,
  character,
  onClose,
  onRoll
}) => {
  if (!isOpen) return null;

  const stats = calculate35eRogueStats(character);
  const [isFlanked, setIsFlanked] = useState<boolean>(true);
  const [isFlatFooted, setIsFlatFooted] = useState<boolean>(false);
  const [isDeniedDex, setIsDeniedDex] = useState<boolean>(false);
  const [isTargetImmune, setIsTargetImmune] = useState<boolean>(false);
  const [hasConcealment, setHasConcealment] = useState<boolean>(false);
  const [logMessage, setLogMessage] = useState<string | null>(null);

  const canSneakAttack = (isFlanked || isFlatFooted || isDeniedDex) && !isTargetImmune && !hasConcealment;

  const handleRollSneakAttack = () => {
    if (!canSneakAttack) {
      setLogMessage('⚠️ Conditions for 3.5e Sneak Attack not met!');
      return;
    }

    const diceCount = stats.sneakAttackDiceCount;
    let totalDmg = 0;
    const rolls: number[] = [];

    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * 6) + 1;
      rolls.push(roll);
      totalDmg += roll;
    }

    const reason = isFlanked ? 'Flanking' : isFlatFooted ? 'Flat-Footed' : 'Denied DEX';

    playDiceSound();
    if (onRoll) {
      onRoll(`${diceCount}d6`, `Sneak Attack (${reason})`);
    }

    setLogMessage(`🗡️ SNEAK ATTACK (${reason})! Dealt ${totalDmg} precision damage [${rolls.join('+')}] (${diceCount}d6).${stats.hasCripplingStrike ? ' Crippling Strike: Deals 2 Strength damage to target!' : ''} (Sneak attack dice are never multiplied on critical hits in 3.5e RAW).`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-stone-900 border border-amber-600/50 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-400">
              <Crosshair className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-200">
                D&D 3.5e Sneak Attack & Precision Suite
              </h2>
              <p className="text-xs text-stone-400">
                PHB p. 50 • Level {stats.rogueLevel} Rogue / Assassin
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

          {/* Sneak Attack Dice Banner */}
          <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-400 font-mono uppercase block">Precision Damage</span>
              <span className="text-2xl font-bold font-mono text-amber-300">
                +{stats.sneakAttackDiceString}
              </span>
              <span className="text-[11px] text-stone-500 block">
                (+1d6 per 2 levels • Not multiplied on critical hits)
              </span>
            </div>

            <button
              onClick={handleRollSneakAttack}
              disabled={!canSneakAttack}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Zap className="w-4 h-4" /> Roll Precision Damage
            </button>
          </div>

          {/* Tactical Conditions Checklist */}
          <div className="p-3.5 bg-stone-950/50 border border-stone-800 rounded-xl space-y-2.5">
            <span className="text-xs font-serif font-bold text-amber-200 block">
              Tactical Trigger Conditions (Must meet at least one):
            </span>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5 text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFlanked}
                  onChange={(e) => setIsFlanked(e.target.checked)}
                  className="rounded border-stone-700 text-amber-600 focus:ring-0"
                />
                <span><strong>Target is Flanked:</strong> An ally is in melee position directly opposite you.</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFlatFooted}
                  onChange={(e) => setIsFlatFooted(e.target.checked)}
                  className="rounded border-stone-700 text-amber-600 focus:ring-0"
                />
                <span><strong>Target is Flat-Footed:</strong> Has not yet acted in combat (lost DEX bonus to AC).</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeniedDex}
                  onChange={(e) => setIsDeniedDex(e.target.checked)}
                  className="rounded border-stone-700 text-amber-600 focus:ring-0"
                />
                <span><strong>Denied DEX to AC:</strong> Stunned, blinded, climbing, or balancing without 5 ranks in Tumble.</span>
              </label>
            </div>
          </div>

          {/* Negators Checklist */}
          <div className="p-3.5 bg-stone-950/50 border border-stone-800 rounded-xl space-y-2.5">
            <span className="text-xs font-serif font-bold text-rose-300 block">
              Precision Negators & 3.5e RAW Immunities:
            </span>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5 text-xs text-rose-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTargetImmune}
                  onChange={(e) => setIsTargetImmune(e.target.checked)}
                  className="rounded border-stone-700 text-rose-600 focus:ring-0"
                />
                <span><strong>Target is Immune to Critical Hits / Precision:</strong> Undead, Construct, Plant, Ooze, Elemental, Incorporeal.</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-rose-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConcealment}
                  onChange={(e) => setHasConcealment(e.target.checked)}
                  className="rounded border-stone-700 text-rose-600 focus:ring-0"
                />
                <span><strong>Target has Concealment (Fog/Shadow/Invis):</strong> Concealment completely prevents Sneak Attacks in 3.5e RAW!</span>
              </label>
            </div>
          </div>

          {/* Rogue Defensive Features Status */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
              <span className="text-stone-400">Evasion (Lvl 2):</span>
              <span className={`font-bold font-mono ${stats.hasEvasion ? 'text-emerald-400' : 'text-stone-600'}`}>
                {stats.hasEvasion ? 'Unlocked (0 dmg on Ref save)' : 'Locked'}
              </span>
            </div>

            <div className="p-2.5 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
              <span className="text-stone-400">Uncanny Dodge (Lvl 4):</span>
              <span className={`font-bold font-mono ${stats.hasUncannyDodge ? 'text-emerald-400' : 'text-stone-600'}`}>
                {stats.hasUncannyDodge ? 'Retain DEX to AC' : 'Locked'}
              </span>
            </div>

            <div className="p-2.5 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
              <span className="text-stone-400">Imp Uncanny Dodge (Lvl 8):</span>
              <span className={`font-bold font-mono ${stats.hasImprovedUncannyDodge ? 'text-emerald-400' : 'text-stone-600'}`}>
                {stats.hasImprovedUncannyDodge ? 'Cannot be Flanked' : 'Locked'}
              </span>
            </div>

            <div className="p-2.5 bg-stone-950/60 border border-stone-800 rounded-xl flex items-center justify-between">
              <span className="text-stone-400">Crippling Strike (Lvl 10):</span>
              <span className={`font-bold font-mono ${stats.hasCripplingStrike ? 'text-purple-400' : 'text-stone-600'}`}>
                {stats.hasCripplingStrike ? '+2 STR Dmg per hit' : 'Locked'}
              </span>
            </div>
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
