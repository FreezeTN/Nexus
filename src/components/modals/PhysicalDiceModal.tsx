import React, { useState, useEffect, useRef } from 'react';
import { Dices, Sparkles, Check, X, ArrowRight, ShieldAlert, Zap } from 'lucide-react';
import { formatModifier } from '../../utils/dndCalculations';

export interface PhysicalRollRequest {
  label: string;
  diceType: number;
  diceCount: number;
  modifier: number;
  mode: 'normal' | 'advantage' | 'disadvantage';
  onConfirm: (rolls: number[], total: number, isNat20: boolean, isNat1: boolean) => void;
  onDigitalFallback: () => void;
  onCancel: () => void;
}

interface PhysicalDiceModalProps {
  request: PhysicalRollRequest | null;
}

export const PhysicalDiceModal: React.FC<PhysicalDiceModalProps> = ({ request }) => {
  if (!request) return null;

  const { label, diceType, diceCount, modifier, mode, onConfirm, onDigitalFallback, onCancel } = request;
  const isD20AdvOrDis = diceType === 20 && (mode === 'advantage' || mode === 'disadvantage');

  // Input states
  const [singleInput, setSingleInput] = useState<string>('');
  const [die1Input, setDie1Input] = useState<string>('');
  const [die2Input, setDie2Input] = useState<string>('');
  const [useSplitD20, setUseSplitD20] = useState<boolean>(isD20AdvOrDis);

  const inputRef = useRef<HTMLInputElement>(null);
  const die1Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset inputs when a new request opens
    setSingleInput('');
    setDie1Input('');
    setDie2Input('');
    setUseSplitD20(isD20AdvOrDis);

    const timer = setTimeout(() => {
      if (isD20AdvOrDis && die1Ref.current) {
        die1Ref.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [request, isD20AdvOrDis]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Compute calculated values
  const parseDiceRolls = (): { rolls: number[]; chosenRoll: number; total: number; isNat20: boolean; isNat1: boolean; isValid: boolean } => {
    if (isD20AdvOrDis && useSplitD20) {
      const d1 = parseInt(die1Input, 10);
      const d2 = parseInt(die2Input, 10);

      if (isNaN(d1) && isNaN(d2)) {
        return { rolls: [0], chosenRoll: 0, total: modifier, isNat20: false, isNat1: false, isValid: false };
      }

      const validD1 = isNaN(d1) ? 1 : Math.max(1, Math.min(20, d1));
      const validD2 = isNaN(d2) ? validD1 : Math.max(1, Math.min(20, d2));
      const rolls = [validD1, validD2];
      const chosenRoll = mode === 'advantage' ? Math.max(...rolls) : Math.min(...rolls);
      const total = chosenRoll + modifier;

      return {
        rolls,
        chosenRoll,
        total,
        isNat20: chosenRoll === 20,
        isNat1: chosenRoll === 1,
        isValid: !isNaN(d1) || !isNaN(d2)
      };
    }

    // Single input or comma-separated list
    const raw = singleInput.trim();
    if (!raw) {
      return { rolls: [0], chosenRoll: 0, total: modifier, isNat20: false, isNat1: false, isValid: false };
    }

    // Check if user entered comma/space separated individual rolls (e.g., "4, 5, 6" or "4 5 6")
    const parts = raw.split(/[\s,+]+/).filter(Boolean).map(p => parseInt(p, 10)).filter(n => !isNaN(n));
    if (parts.length > 1) {
      const sum = parts.reduce((a, b) => a + b, 0);
      return {
        rolls: parts,
        chosenRoll: sum,
        total: sum + modifier,
        isNat20: diceType === 20 && parts.length === 1 && parts[0] === 20,
        isNat1: diceType === 20 && parts.length === 1 && parts[0] === 1,
        isValid: true
      };
    }

    const val = parseInt(raw, 10);
    if (isNaN(val)) {
      return { rolls: [0], chosenRoll: 0, total: modifier, isNat20: false, isNat1: false, isValid: false };
    }

    const chosenRoll = Math.max(1, val);
    const rolls = [chosenRoll];
    const total = chosenRoll + modifier;
    const isNat20 = diceType === 20 && chosenRoll === 20;
    const isNat1 = diceType === 20 && chosenRoll === 1;

    return { rolls, chosenRoll, total, isNat20, isNat1, isValid: true };
  };

  const computed = parseDiceRolls();

  const handleConfirmSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!computed.isValid && !singleInput && !die1Input) {
      // If blank, default to average / 10 for d20
      const defaultRoll = diceType === 20 ? 10 : Math.max(1, Math.round(diceType / 2) * diceCount);
      onConfirm([defaultRoll], defaultRoll + modifier, diceType === 20 && defaultRoll === 20, diceType === 20 && defaultRoll === 1);
      return;
    }
    onConfirm(computed.rolls, computed.total, computed.isNat20, computed.isNat1);
  };

  const handlePresetD20 = (val: number) => {
    if (isD20AdvOrDis && useSplitD20) {
      if (!die1Input) {
        setDie1Input(String(val));
      } else {
        setDie2Input(String(val));
      }
    } else {
      setSingleInput(String(val));
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 border-2 border-amber-600/60 rounded-2xl shadow-2xl p-5 max-w-md w-full text-stone-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Ambient gold glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/80 border border-amber-600/50 rounded-xl text-amber-300">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <span>Physical Tabletop Dice Mode</span>
                {mode !== 'normal' && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                    mode === 'advantage' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                  }`}>
                    {mode}
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-lg text-amber-100 leading-snug truncate max-w-[280px]">
                {label}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formula & Modifier Banner */}
        <div className="bg-stone-950/90 border border-stone-800 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-400 font-mono">Formula</div>
            <div className="font-mono text-sm font-extrabold text-amber-300">
              {diceCount}d{diceType}
              <span className="text-stone-300 font-normal"> {formatModifier(modifier)}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-stone-400 font-mono">Die Type</div>
            <div className="font-mono text-xs font-bold text-stone-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-800 inline-block">
              d{diceType} (1 – {diceType * diceCount})
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleConfirmSubmit} className="space-y-4">
          {isD20AdvOrDis && (
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="text-stone-400 font-mono text-[11px]">
                Enter both physical rolls for {mode}:
              </span>
              <button
                type="button"
                onClick={() => setUseSplitD20(!useSplitD20)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline"
              >
                {useSplitD20 ? 'Switch to single total' : 'Enter 2 individual dice'}
              </button>
            </div>
          )}

          {isD20AdvOrDis && useSplitD20 ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1">
                  1st Physical Die
                </label>
                <input
                  ref={die1Ref}
                  type="number"
                  min="1"
                  max="20"
                  placeholder="e.g. 14"
                  value={die1Input}
                  onChange={(e) => setDie1Input(e.target.value)}
                  className="w-full bg-stone-950 border-2 border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-center text-xl font-mono font-bold text-amber-200 focus:outline-none transition shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1">
                  2nd Physical Die
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="e.g. 18"
                  value={die2Input}
                  onChange={(e) => setDie2Input(e.target.value)}
                  className="w-full bg-stone-950 border-2 border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-center text-xl font-mono font-bold text-amber-200 focus:outline-none transition shadow-inner"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-mono uppercase text-stone-300 mb-1 flex items-center justify-between">
                <span>Enter Physical Die Result {diceCount > 1 ? `(Sum or "${diceCount}d${diceType}")` : ''}</span>
                {diceCount > 1 && (
                  <span className="text-[10px] text-stone-500 font-normal">e.g. &ldquo;18&rdquo; or &ldquo;4 5 9&rdquo;</span>
                )}
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder={diceType === 20 ? "Physical roll (1-20)..." : `Total on your ${diceCount}d${diceType}...`}
                value={singleInput}
                onChange={(e) => setSingleInput(e.target.value)}
                className="w-full bg-stone-950 border-2 border-stone-700 focus:border-amber-500 rounded-xl px-4 py-3 text-center text-2xl font-mono font-extrabold text-amber-200 focus:outline-none transition shadow-inner"
              />
            </div>
          )}

          {/* Quick Preset Buttons for d20 */}
          {diceType === 20 && (
            <div className="flex items-center gap-1.5 justify-center flex-wrap pt-0.5">
              <span className="text-[10px] font-mono text-stone-500 mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => handlePresetD20(20)}
                className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 rounded-lg text-xs font-mono font-bold transition shadow-sm"
              >
                ⭐ NAT 20
              </button>
              <button
                type="button"
                onClick={() => handlePresetD20(15)}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded-lg text-xs font-mono font-bold transition"
              >
                15
              </button>
              <button
                type="button"
                onClick={() => handlePresetD20(10)}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded-lg text-xs font-mono font-bold transition"
              >
                10
              </button>
              <button
                type="button"
                onClick={() => handlePresetD20(1)}
                className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-200 rounded-lg text-xs font-mono font-bold transition shadow-sm"
              >
                💀 NAT 1
              </button>
            </div>
          )}

          {/* Live Calculated Outcome Preview */}
          <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-3 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-stone-400 font-mono text-[10px] block">CALCULATION</span>
              <div className="font-mono text-stone-200 flex items-center gap-1 mt-0.5">
                <span>Roll ({computed.chosenRoll || '—'})</span>
                <span>+</span>
                <span>Mod ({modifier >= 0 ? `+${modifier}` : modifier})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">Final Total</span>
                <div className="text-2xl font-mono font-black text-amber-200">
                  {computed.isValid ? computed.total : '—'}
                </div>
              </div>
              {computed.isNat20 && (
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-1 rounded-full animate-bounce">
                  NAT 20!
                </span>
              )}
              {computed.isNat1 && (
                <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-1 rounded-full">
                  NAT 1!
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-stone-950 font-serif font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Roll (Enter)</span>
            </button>

            <button
              type="button"
              onClick={onDigitalFallback}
              className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-200 border border-stone-700 rounded-xl text-xs font-mono transition flex items-center gap-1.5"
              title="Roll this check with the digital random dice roller instead"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Roll Digitally</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
