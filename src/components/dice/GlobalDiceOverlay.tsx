import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DiceRollResult } from '../../types';
import { DICE_SKINS } from './diceSkins';
import { PolyhedralDie } from './PolyhedralDie';
import { Sparkles, ShieldAlert, X } from 'lucide-react';

interface GlobalDiceOverlayProps {
  rollResult: DiceRollResult | null;
  onDismiss: () => void;
  displayDurationMs?: number;
}

export const GlobalDiceOverlay: React.FC<GlobalDiceOverlayProps> = ({
  rollResult,
  onDismiss,
  displayDurationMs = 5000
}) => {
  const [isRolling, setIsRolling] = useState(true);
  const [currentSkinId, setCurrentSkinId] = useState('standard');

  useEffect(() => {
    try {
      const savedSkin = localStorage.getItem('nexus_dice_skin') || 'standard';
      setCurrentSkinId(savedSkin);
    } catch {
      setCurrentSkinId('standard');
    }
  }, [rollResult]);

  // Roll animation timer
  useEffect(() => {
    if (!rollResult) return;

    setIsRolling(true);
    const rollTimer = setTimeout(() => {
      setIsRolling(false);
    }, 600);

    return () => clearTimeout(rollTimer);
  }, [rollResult]);

  if (!rollResult) return null;

  const skin = DICE_SKINS.find(s => s.id === currentSkinId) || DICE_SKINS[0];
  const isD20 = rollResult.expression.includes('d20') || (rollResult.diceRolls.length > 0 && rollResult.diceRolls.every(r => r <= 20));
  const dieType = isD20 ? 20 : (parseInt(rollResult.expression.replace(/^[^\d]*\d*d(\d+).*$/, '$1')) || 20);

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
          className="relative pointer-events-auto flex flex-col items-center justify-center bg-stone-950/90 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-xl max-w-sm sm:max-w-md w-full select-none cursor-pointer"
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
          <div className="relative z-10 flex items-center gap-2 mb-3">
            <span className="font-serif font-bold text-amber-300 text-base sm:text-lg text-center tracking-wide drop-shadow">
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
          <div className="relative z-10 my-3 flex items-center justify-center gap-4">
            {rollResult.diceRolls.map((val, idx) => (
              <PolyhedralDie
                key={idx}
                dieType={dieType}
                value={val}
                skin={skin}
                isRolling={isRolling}
                size={rollResult.diceRolls.length > 2 ? 80 : 108}
              />
            ))}
          </div>

          {/* Mathematical Calculation breakdown & Total */}
          <div className="relative z-10 mt-2 flex flex-col items-center">
            <div className="flex items-baseline gap-2 text-stone-300">
              <span className="text-xs font-mono text-stone-400">
                [{rollResult.diceRolls.join(', ')}] {rollResult.modifier >= 0 ? `+ ${rollResult.modifier}` : `- ${Math.abs(rollResult.modifier)}`} =
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

          {/* Click to dismiss prompt */}
          <span className="relative z-10 mt-4 text-[10px] text-stone-500 font-mono">
            Click anywhere or press Esc to dismiss
          </span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
