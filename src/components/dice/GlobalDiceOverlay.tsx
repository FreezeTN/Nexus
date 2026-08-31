import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DiceRollResult } from '../../types';
import { DICE_SKINS } from './diceSkins';
import { PolyhedralDie } from './PolyhedralDie';
import { Sparkles, ShieldAlert, X, Heart, Swords, Shield, Check, Crosshair } from 'lucide-react';
import { eventBus } from '../../events/eventBus';

interface GlobalDiceOverlayProps {
  rollResult: DiceRollResult | null;
  onDismiss: () => void;
  displayDurationMs?: number;
}

interface QuickCombatantOption {
  id: string;
  name: string;
  type: string;
  hpCurrent: number;
  hpMax: number;
}

export const GlobalDiceOverlay: React.FC<GlobalDiceOverlayProps> = ({
  rollResult,
  onDismiss,
  displayDurationMs = 5000
}) => {
  const [isRolling, setIsRolling] = useState(true);
  const [currentSkinId, setCurrentSkinId] = useState('standard');
  const [combatantsList, setCombatantsList] = useState<QuickCombatantOption[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedSkin = localStorage.getItem('nexus_dice_skin') || 'standard';
      setCurrentSkinId(savedSkin);
    } catch {
      setCurrentSkinId('standard');
    }
  }, [rollResult]);

  // Load active combatants from localStorage
  useEffect(() => {
    if (!rollResult) return;
    try {
      const activeCharId = localStorage.getItem('dnd_active_character_id') || 'default';
      const raw = localStorage.getItem(`dnd_encounter_state_v1_${activeCharId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.combatants && Array.isArray(parsed.combatants)) {
          const list: QuickCombatantOption[] = parsed.combatants.map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type || 'enemy',
            hpCurrent: c.hpCurrent,
            hpMax: c.hpMax
          }));
          setCombatantsList(list);
          if (list.length > 0) {
            // Default to first enemy or first combatant
            const defaultTarget = list.find(c => c.type === 'enemy' && c.hpCurrent > 0) || list[0];
            setSelectedTargetId(defaultTarget.id);
          }
        }
      }
    } catch {
      // Ignore
    }
  }, [rollResult]);

  // Roll animation timer
  useEffect(() => {
    if (!rollResult) return;

    setIsRolling(true);
    setAppliedFeedback(null);
    const rollTimer = setTimeout(() => {
      setIsRolling(false);
    }, 600);

    return () => clearTimeout(rollTimer);
  }, [rollResult]);

  if (!rollResult) return null;

  const skin = DICE_SKINS.find(s => s.id === currentSkinId) || DICE_SKINS[0];
  const isD20 = rollResult.expression.includes('d20') || (rollResult.diceRolls.length > 0 && rollResult.diceRolls.every(r => r <= 20));
  const dieType = isD20 ? 20 : (parseInt(rollResult.expression.replace(/^[^\d]*\d*d(\d+).*$/, '$1')) || 20);

  const isDamageOrHeal = Boolean(
    rollResult.label.match(/damage|heal|cure|potion|attack|slash|pierc|bludgeon|fire|cold|lightning|acid|poison|radiant|necrotic|psychic|force|thunder|breath/i) ||
    (dieType !== 20 && rollResult.diceRolls.length > 0)
  );

  const selectedTarget = combatantsList.find(c => c.id === selectedTargetId) || combatantsList[0];

  const handleApply = (multiplier: number, isHeal: boolean = false) => {
    if (!selectedTarget) return;
    const rawVal = rollResult.total;
    const finalAmount = isHeal
      ? rawVal
      : multiplier === 0.5
      ? -Math.floor(rawVal / 2)
      : multiplier === 2
      ? -(rawVal * 2)
      : -rawVal;

    eventBus.emit('ApplyDamageOrHeal', {
      targetCombatantId: selectedTarget.id,
      targetName: selectedTarget.name,
      amount: finalAmount,
      sourceLabel: rollResult.label
    });

    const msg = isHeal
      ? `💚 Healed ${selectedTarget.name} for +${rawVal} HP!`
      : multiplier === 0.5
      ? `🛡️ Applied Half Damage (-${Math.floor(rawVal / 2)} HP) to ${selectedTarget.name}`
      : multiplier === 2
      ? `🔥 Applied Double Damage (-${rawVal * 2} HP) to ${selectedTarget.name}`
      : `💥 Applied Full Damage (-${rawVal} HP) to ${selectedTarget.name}`;

    setAppliedFeedback(msg);

    setTimeout(() => {
      onDismiss();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4"
        id="global-dice-overlay-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative pointer-events-auto flex flex-col items-center justify-center bg-stone-950/95 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-xl max-w-sm sm:max-w-md w-full select-none cursor-pointer"
          onClick={onDismiss}
        >
          {/* Ambient Glow Aura */}
          <div className={`absolute inset-0 rounded-3xl opacity-50 pointer-events-none ${skin.ambientGlow} ${skin.particleEffect ? 'animate-pulse' : ''}`} />

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition border border-stone-700 cursor-pointer"
            title="Dismiss Roll Display"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Roll Header / Category */}
          <div className="relative z-10 flex items-center gap-2 mb-3 text-center px-4">
            <span className="font-serif font-bold text-amber-300 text-base sm:text-lg tracking-wide drop-shadow">
              {rollResult.label}
            </span>
          </div>

          {/* Mode Badge if Advantage or Disadvantage */}
          {rollResult.mode && rollResult.mode !== 'normal' && (
            <div className={`relative z-10 px-3 py-0.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider mb-2 border ${
              rollResult.mode === 'advantage'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                : 'bg-rose-950/90 text-rose-300 border-rose-500/60'
            }`}>
              {rollResult.mode}
            </div>
          )}

          {/* 3D Animated Polyhedral Dice Representation */}
          <div className="relative z-10 my-3 flex items-center justify-center gap-3.5 flex-wrap max-w-full px-2">
            {rollResult.diceDetails && rollResult.diceDetails.length > 0 ? (
              rollResult.diceDetails.map((detail, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <PolyhedralDie
                    dieType={detail.die}
                    value={detail.value}
                    skin={skin}
                    isRolling={isRolling}
                    size={rollResult.diceDetails!.length > 4 ? 54 : rollResult.diceDetails!.length > 2 ? 68 : 88}
                  />
                  <span className={`text-[10px] font-mono mt-0.5 ${detail.discarded ? 'text-stone-500 line-through' : 'text-amber-400/90 font-bold'}`}>
                    d{detail.die}
                  </span>
                </div>
              ))
            ) : (
              rollResult.diceRolls.map((val, idx) => (
                <PolyhedralDie
                  key={idx}
                  dieType={dieType}
                  value={val}
                  skin={skin}
                  isRolling={isRolling}
                  size={rollResult.diceRolls.length > 2 ? 72 : 96}
                />
              ))
            )}
          </div>

          {/* Mathematical Calculation breakdown & Total */}
          <div className="relative z-10 mt-1 flex flex-col items-center">
            <div className="flex items-baseline gap-2 text-stone-300 flex-wrap justify-center text-center">
              <span className="text-xs font-mono text-stone-400">
                {rollResult.expression} [{rollResult.diceRolls.join(', ')}] =
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">
                {rollResult.total}
              </span>
            </div>

            {/* Critical Hit / Natural 20 or Natural 1 Badges */}
            {rollResult.isNat20 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-amber-300 bg-amber-500/20 border border-amber-400/60 px-3 py-1 rounded-full animate-bounce">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>NATURAL 20 CRITICAL SUCCESS!</span>
              </div>
            )}

            {rollResult.isNat1 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-black text-rose-300 bg-rose-600/20 border border-rose-500/60 px-3 py-1 rounded-full">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>CRITICAL FAILURE (NAT 1)</span>
              </div>
            )}
          </div>

          {/* Direct Damage / Healing Application Action Box */}
          {combatantsList.length > 0 && !isRolling && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 mt-4 w-full bg-stone-900/90 border border-stone-700/80 rounded-2xl p-3 shadow-inner space-y-2.5"
              onClick={(e) => e.stopPropagation()}
            >
              {appliedFeedback ? (
                <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-600/60 rounded-xl animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{appliedFeedback}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-stone-300 flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-amber-400" />
                      <span>Target Combatant:</span>
                    </label>
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="bg-stone-950 border border-stone-700 text-stone-200 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-amber-500 max-w-[170px] truncate"
                    >
                      {combatantsList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.hpCurrent}/{c.hpMax} HP)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApply(1, false)}
                      className="flex items-center justify-center gap-1 bg-rose-700 hover:bg-rose-600 text-white font-bold text-[11px] py-1.5 px-2 rounded-xl transition shadow cursor-pointer"
                      title={`Apply ${rollResult.total} Damage`}
                    >
                      <Swords className="w-3 h-3" />
                      <span>Damage (-{rollResult.total})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApply(0.5, false)}
                      className="flex items-center justify-center gap-1 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[11px] py-1.5 px-2 rounded-xl transition border border-stone-600 cursor-pointer"
                      title={`Apply Half Damage (${Math.floor(rollResult.total / 2)}) on Save Success`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>Half (-{Math.floor(rollResult.total / 2)})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApply(2, false)}
                      className="flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-[11px] py-1.5 px-2 rounded-xl transition shadow cursor-pointer"
                      title={`Apply Double Damage (${rollResult.total * 2}) on Crit / Vulnerability`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Double (-{rollResult.total * 2})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApply(1, true)}
                      className="flex items-center justify-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] py-1.5 px-2 rounded-xl transition shadow cursor-pointer"
                      title={`Apply +${rollResult.total} Healing`}
                    >
                      <Heart className="w-3 h-3 text-emerald-200 fill-emerald-200" />
                      <span>Heal (+{rollResult.total})</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Click to dismiss prompt */}
          <span className="relative z-10 mt-3 text-[10px] text-stone-500 font-mono">
            Click outside or press Esc to dismiss
          </span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

