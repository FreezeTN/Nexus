import React from 'react';
import { MassiveDamagePrompt } from './encounterTypes';
import { Skull, Dices, Check, X, ShieldAlert, HeartCrack } from 'lucide-react';

interface MassiveDamageWatchdogBannerProps {
  prompt: MassiveDamagePrompt | null;
  onRollCheck: () => void;
  onResolve: (passed: boolean) => void;
  onDismiss: () => void;
}

export const MassiveDamageWatchdogBanner: React.FC<MassiveDamageWatchdogBannerProps> = ({
  prompt,
  onRollCheck,
  onResolve,
  onDismiss
}) => {
  if (!prompt) return null;

  const { combatantName, damageTaken, fortSaveDc, fortMod } = prompt;
  const modSign = fortMod >= 0 ? `+${fortMod}` : `${fortMod}`;

  return (
    <div
      className="bg-gradient-to-r from-red-950 via-rose-950/90 to-stone-950 border-2 border-red-500 rounded-2xl p-4 shadow-2xl space-y-3 animate-fadeIn text-stone-100"
      id="massive-damage-watchdog-banner"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/60 flex items-center justify-center text-red-300 shadow shrink-0 animate-pulse">
            <Skull className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <div className="font-serif font-bold text-red-200 text-sm sm:text-base flex items-center gap-2 flex-wrap">
              <span>💀 Massive Damage Alert! (3.5e PHB p. 145)</span>
              <span className="bg-red-500 text-stone-950 text-xs px-2.5 py-0.5 rounded-full font-mono font-black shadow">
                DC {fortSaveDc} Fortitude Save
              </span>
            </div>
            <p className="text-xs text-stone-300 font-sans mt-0.5">
              <strong className="text-red-300">{combatantName}</strong> sustained <strong className="text-rose-400">{damageTaken} damage</strong> in a single blow!
              Failure results in <span className="text-red-400 font-bold underline">Instant Death</span> (drops to -10 HP / Dead).
              (Fortitude Modifier: <span className="font-mono font-bold text-amber-300">{modSign}</span>)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 hover:bg-stone-800/80 rounded-lg text-stone-400 hover:text-stone-200 transition cursor-pointer"
          title="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-red-500/30">
        <button
          type="button"
          onClick={onRollCheck}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg cursor-pointer"
          title={`Roll d20 + ${modSign} vs DC ${fortSaveDc}`}
        >
          <Dices className="w-4 h-4" />
          <span>🎲 Roll Fortitude Save (d20 {modSign} vs DC {fortSaveDc})</span>
        </button>

        <button
          type="button"
          onClick={() => onResolve(true)}
          className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs px-3 py-2 rounded-xl transition border border-emerald-600/60 shadow cursor-pointer"
          title="Mark Save as Passed (Survives Trauma)"
        >
          <Check className="w-3.5 h-3.5 text-emerald-300" />
          <span>🛡️ Survived Shock (Manual Pass)</span>
        </button>

        <button
          type="button"
          onClick={() => onResolve(false)}
          className="flex items-center gap-1.5 bg-rose-950 hover:bg-black text-rose-200 font-bold text-xs px-3 py-2 rounded-xl transition border border-rose-800/80 shadow cursor-pointer"
          title="Mark Save as Failed (Instant Death at -10 HP)"
        >
          <HeartCrack className="w-3.5 h-3.5 text-rose-400" />
          <span>💀 Instant Death (Manual Fail)</span>
        </button>
      </div>
    </div>
  );
};
