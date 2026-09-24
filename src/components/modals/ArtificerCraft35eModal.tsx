import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  getArtificerCraftReserve,
  getArtificerBonusFeats
} from '../../utils/calculators/supplemental35eCalculators';
import { Hammer, Sparkles, Shield, Wrench, X, Plus, Minus, CheckCircle2, Lock, ArrowDownToLine, Flame } from 'lucide-react';
import { getCombinedLevel } from '../../utils/dndCalculations';

interface ArtificerCraft35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const ArtificerCraft35eModal: React.FC<ArtificerCraft35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  const level = getCombinedLevel(character);
  const baseCraftReserve = getArtificerCraftReserve(level);

  const existingState = character.artificerCraft35e || {
    craftReserveSpent: 0,
    craftReserveBonus: 0,
    salvagedEssence: 0
  };

  const totalReserve = baseCraftReserve + (existingState.craftReserveBonus || 0) + (existingState.salvagedEssence || 0);
  const spentReserve = existingState.craftReserveSpent || 0;
  const remainingReserve = Math.max(0, totalReserve - spentReserve);

  const [spendInput, setSpendInput] = useState('');
  const [salvageInput, setSalvageInput] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const bonusFeats = getArtificerBonusFeats(level);

  const handleSpendCraftXp = () => {
    setStatusNotice(null);
    const val = parseInt(spendInput, 10);
    if (isNaN(val) || val <= 0) return;
    const nextSpent = spentReserve + val;
    onUpdateCharacter({
      ...character,
      artificerCraft35e: {
        ...existingState,
        craftReserveSpent: nextSpent
      }
    });
    setSpendInput('');
    setStatusNotice(`✨ Spent ${val} Craft XP from reserve.`);
  };

  const handleSalvageItem = () => {
    setStatusNotice(null);
    const val = parseInt(salvageInput, 10);
    if (isNaN(val) || val <= 0) return;
    const nextSalvaged = (existingState.salvagedEssence || 0) + val;
    onUpdateCharacter({
      ...character,
      artificerCraft35e: {
        ...existingState,
        salvagedEssence: nextSalvaged
      }
    });
    setSalvageInput('');
    setStatusNotice(`✨ Retain Essence: Salvaged item! Added ${val} craft XP points to your reserve.`);
  };

  const handleResetLevelReserve = () => {
    onUpdateCharacter({
      ...character,
      artificerCraft35e: {
        ...existingState,
        craftReserveSpent: 0
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-blue-500/40 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950/60 border border-blue-600/40 rounded-lg text-blue-400">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Artificer: Craft Reserve & Infusions Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50 font-mono">
                  Eberron 3.5e
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Item creation reserve XP pool, item creation feat unlocks, and essence recycling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {statusNotice && (
            <div className="p-3 bg-blue-950/80 border border-blue-500/60 rounded-xl text-blue-200 text-xs flex items-center justify-between animate-fadeIn">
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="text-blue-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Craft Reserve Pool Card */}
          <div className="p-4 bg-gradient-to-r from-blue-950/40 via-neutral-900 to-blue-950/20 border border-blue-800/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Craft Reserve (Craft XP Pool)
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-white font-mono">{remainingReserve}</span>
                <span className="text-neutral-400 text-sm font-semibold">/ {totalReserve} Craft XP Available</span>
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                Base for Lvl {level}: {baseCraftReserve} XP • Spent: {spentReserve} XP • Salvaged: {existingState.salvagedEssence || 0} XP
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetLevelReserve}
              className="px-3 py-2 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/60 rounded-lg text-xs font-bold transition shadow"
              title="Reset spent craft reserve upon leveling up"
            >
              Reset Level Reserve
            </button>
          </div>

          {/* Quick Craft Action & Salvage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Spend Craft XP */}
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Spend Craft XP</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Crafting scrolls, potions, wands, and wondrous items costs XP. Deduct XP from your reserve instead of your character level!
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  placeholder="XP amount (e.g. 50)"
                  value={spendInput}
                  onChange={e => setSpendInput(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSpendCraftXp}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition"
                >
                  Deduct
                </button>
              </div>
            </div>

            {/* Retain Essence */}
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Retain Essence</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">Lvl 5+</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Salvage an existing magic item into raw Craft XP (adds 1/2 of the original creation XP into your Craft Reserve pool).
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  placeholder="Salvaged XP amount"
                  value={salvageInput}
                  onChange={e => setSalvageInput(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSalvageItem}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition"
                >
                  Salvage
                </button>
              </div>
            </div>
          </div>

          {/* Item Creation Feats Progression */}
          <div className="p-3 bg-neutral-950/50 border border-neutral-800 rounded-xl">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-400" /> Artificer Item Creation Feats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {bonusFeats.map(f => (
                <div
                  key={f.featName}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                    f.isUnlocked
                      ? 'bg-blue-950/30 border-blue-600/50 text-white'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs">{f.featName}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">Unlocks Lvl {f.unlockedLevel}</div>
                  </div>
                  {f.isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-neutral-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Craft Reserve Available: <strong className="text-blue-300 font-mono">{remainingReserve} XP</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
