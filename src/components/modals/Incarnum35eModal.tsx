import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  getBaseEssentiaPool,
  getEssentiaCapacityCap,
  INCARNUM_CHAKRA_SLOTS
} from '../../utils/calculators/supplemental35eCalculators';
import { Sparkles, Shield, Zap, X, Plus, Minus, CheckCircle2, RotateCcw, Gem } from 'lucide-react';
import { getCombinedLevel } from '../../utils/dndCalculations';

interface Incarnum35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const Incarnum35eModal: React.FC<Incarnum35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  const level = getCombinedLevel(character);
  const className = character.characterClass || 'Incarnate';
  const basePool = getBaseEssentiaPool(className, level);
  const capacityCap = getEssentiaCapacityCap(level);

  const existingState = character.incarnum35e || {
    bonusEssentia: 0,
    soulmelds: [
      { name: 'Crystal Helm', investedEssentia: 1, boundChakra: 'Crown' },
      { name: 'Manticore Belt', investedEssentia: 1, boundChakra: 'Waist' },
      { name: 'Airstep Sandals', investedEssentia: 0 }
    ]
  };

  const [bonusEssentia, setBonusEssentia] = useState<number>(existingState.bonusEssentia || 0);
  const [soulmelds, setSoulmelds] = useState(existingState.soulmelds || []);
  const [newSoulmeldName, setNewSoulmeldName] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPool = basePool + bonusEssentia;
  const totalInvested = soulmelds.reduce((sum, s) => sum + (s.investedEssentia || 0), 0);
  const availableEssentia = Math.max(0, totalPool - totalInvested);

  const handleAdjustInvested = (index: number, delta: number) => {
    setStatusNotice(null);
    const target = soulmelds[index];
    const current = target.investedEssentia || 0;
    const nextVal = current + delta;

    if (delta > 0) {
      if (availableEssentia <= 0) {
        setStatusNotice('⚠️ Essentia Pool Depleted: No available essentia left to invest!');
        return;
      }
      if (nextVal > capacityCap) {
        setStatusNotice(`⚠️ Capacity Reached: Maximum essentia capacity for your level is ${capacityCap} per soulmeld.`);
        return;
      }
    } else {
      if (nextVal < 0) return;
    }

    const updated = [...soulmelds];
    updated[index] = { ...target, investedEssentia: nextVal };
    setSoulmelds(updated);
  };

  const handleAddSoulmeld = () => {
    if (!newSoulmeldName.trim()) return;
    setSoulmelds(prev => [
      ...prev,
      { name: newSoulmeldName.trim(), investedEssentia: 0 }
    ]);
    setNewSoulmeldName('');
  };

  const handleRemoveSoulmeld = (index: number) => {
    setSoulmelds(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdateCharacter({
      ...character,
      incarnum35e: {
        bonusEssentia,
        soulmelds
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-cyan-500/40 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/60 border border-cyan-600/40 rounded-lg text-cyan-400">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Magic of Incarnum: Essentia & Soulmelds
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 font-mono">
                  3.5e
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Channel soul energy, shift essentia turn-by-turn as swift actions, and bind chakras
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
            <div className="p-3 bg-amber-950/80 border border-amber-500/60 rounded-xl text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="text-amber-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Essentia Pool Banner */}
          <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-neutral-900 to-cyan-950/20 border border-cyan-800/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Essentia Pool Allocation
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-white font-mono">{availableEssentia}</span>
                <span className="text-neutral-400 text-sm font-semibold">/ {totalPool} Essentia Available</span>
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                Invested: <span className="text-cyan-300 font-mono font-bold">{totalInvested}</span> • Max Capacity Cap: <span className="text-cyan-300 font-mono font-bold">{capacityCap}</span> per soulmeld
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400">Bonus Essentia:</span>
              <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setBonusEssentia(Math.max(0, bonusEssentia - 1))}
                  className="p-1 text-neutral-400 hover:text-white rounded"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-mono font-bold text-cyan-300 px-1">{bonusEssentia}</span>
                <button
                  type="button"
                  onClick={() => setBonusEssentia(bonusEssentia + 1)}
                  className="p-1 text-neutral-400 hover:text-white rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Shaped Soulmelds Manager */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Shaped Soulmelds & Chakra Binds
              </h3>
              <span className="text-xs text-neutral-400">{soulmelds.length} Soulmelds Shaped</span>
            </div>

            {soulmelds.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 bg-neutral-950/40 rounded-xl border border-neutral-800 text-xs">
                No soulmelds currently shaped. Add your shaped soulmelds below.
              </div>
            ) : (
              <div className="space-y-2">
                {soulmelds.map((sm, index) => (
                  <div
                    key={index}
                    className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="font-bold text-xs text-white">{sm.name}</span>
                      <select
                        value={sm.boundChakra || ''}
                        onChange={e => {
                          const updated = [...soulmelds];
                          updated[index] = { ...sm, boundChakra: e.target.value || undefined };
                          setSoulmelds(updated);
                        }}
                        className="bg-neutral-900 border border-neutral-700 rounded text-[11px] text-neutral-300 px-2 py-0.5 focus:outline-none"
                      >
                        <option value="">Shaped (No Chakra Bind)</option>
                        {INCARNUM_CHAKRA_SLOTS.map(chakra => (
                          <option key={chakra} value={chakra}>
                            Bound to {chakra} Chakra
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Invested Essentia Controls */}
                      <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700/80 rounded-lg px-2 py-1">
                        <span className="text-[11px] text-neutral-400">Invested:</span>
                        <button
                          type="button"
                          onClick={() => handleAdjustInvested(index, -1)}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-cyan-300 text-xs px-1">
                          {sm.investedEssentia || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustInvested(index, 1)}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSoulmeld(index)}
                        className="text-neutral-500 hover:text-red-400 p-1 transition"
                        title="Unshape soulmeld"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Soulmeld */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="New soulmeld name (e.g. Incarnate Weapon, Sphinx Claws)"
                value={newSoulmeldName}
                onChange={e => setNewSoulmeldName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSoulmeld()}
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleAddSoulmeld}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Shape Soulmeld
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Active Soulmelds: <strong className="text-cyan-300 font-mono">{soulmelds.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition"
            >
              Save Incarnum State
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
