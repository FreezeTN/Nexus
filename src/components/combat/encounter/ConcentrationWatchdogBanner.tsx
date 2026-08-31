import React from 'react';
import { ConcentrationPrompt } from './encounterTypes';
import { Sparkles, Dices, Check, X, ShieldAlert, Zap } from 'lucide-react';

interface ConcentrationWatchdogBannerProps {
  prompt: ConcentrationPrompt | null;
  onRollCheck: () => void;
  onResolve: (passed: boolean) => void;
  onDismiss: () => void;
}

export const ConcentrationWatchdogBanner: React.FC<ConcentrationWatchdogBannerProps> = ({
  prompt,
  onRollCheck,
  onResolve,
  onDismiss
}) => {
  if (!prompt) return null;

  const { combatantName, spellName = 'Spell', damageTaken, conSaveDc, conMod } = prompt;
  const modSign = conMod >= 0 ? `+${conMod}` : `${conMod}`;

  return (
    <div
      className="bg-gradient-to-r from-amber-950 via-rose-950/80 to-amber-950 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl space-y-3 animate-fadeIn"
      id="concentration-watchdog-banner"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow shrink-0 animate-bounce">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="font-serif font-bold text-amber-200 text-sm sm:text-base flex items-center gap-2 flex-wrap">
              <span>⚠️ Concentration Check Required!</span>
              <span className="bg-amber-400 text-stone-950 text-xs px-2.5 py-0.5 rounded-full font-mono font-black shadow">
                DC {conSaveDc} CON Save
              </span>
            </div>
            <p className="text-xs text-stone-300 font-sans mt-0.5">
              <strong className="text-amber-300">{combatantName}</strong> took <strong className="text-rose-400">{damageTaken} damage</strong> while concentrating on <strong className="text-amber-200 font-serif">"{spellName}"</strong>.
              (CON Modifier: <span className="font-mono font-bold text-amber-300">{modSign}</span>)
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

      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-amber-500/30">
        <button
          type="button"
          onClick={onRollCheck}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg cursor-pointer"
          title={`Roll d20 + ${modSign} vs DC ${conSaveDc}`}
        >
          <Dices className="w-4 h-4" />
          <span>🎲 Roll CON Save (d20 {modSign} vs DC {conSaveDc})</span>
        </button>

        <button
          type="button"
          onClick={() => onResolve(true)}
          className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs px-3 py-2 rounded-xl transition border border-emerald-600/60 shadow cursor-pointer"
          title="Mark Save as Passed (Maintain Concentration)"
        >
          <Check className="w-3.5 h-3.5 text-emerald-300" />
          <span>✨ Maintained (Manual Pass)</span>
        </button>

        <button
          type="button"
          onClick={() => onResolve(false)}
          className="flex items-center gap-1.5 bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold text-xs px-3 py-2 rounded-xl transition border border-rose-700/60 shadow cursor-pointer"
          title="Mark Save as Failed (Break Concentration)"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
          <span>💥 Broke Concentration (Manual Fail)</span>
        </button>
      </div>
    </div>
  );
};
