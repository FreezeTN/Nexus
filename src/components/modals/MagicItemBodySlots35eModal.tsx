import React, { useState } from 'react';
import { CharacterData, GearItem } from '../../types';
import {
  calculate35eBodySlotUsage,
  OFFICIAL_35E_BODY_SLOTS,
  Dnd35eBodySlotOccupant
} from '../../utils/calculators/classFeatures35eCalculators';
import { recalculateCharacterAC } from '../../utils/dndCalculations';
import {
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Info
} from 'lucide-react';

interface MagicItemBodySlots35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onClose: () => void;
  onUpdateCharacter?: (updated: CharacterData) => void;
}

export const MagicItemBodySlots35eModal: React.FC<MagicItemBodySlots35eModalProps> = ({
  isOpen,
  character,
  onClose,
  onUpdateCharacter
}) => {
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const bodyUsage = calculate35eBodySlotUsage(character);
  const inventory = character.inventory || [];

  const handleUnequipItem = (itemId: string) => {
    if (!onUpdateCharacter) return;
    const updatedInventory = inventory.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          equipped: false
        };
      }
      return item;
    });

    const updated = recalculateCharacterAC({
      ...character,
      inventory: updatedInventory
    });

    onUpdateCharacter(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-sky-600/60 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-950 via-stone-900 to-stone-900 p-4 border-b border-sky-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-500 flex items-center justify-center text-sky-400 shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-black text-sky-200">
                  Official 3.5e Magic Item Body Slots
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-600 rounded-full font-mono font-bold">
                  {bodyUsage.totalEquippedCount} Items Equipped
                </span>
                {bodyUsage.hasConflicts && (
                  <span className="text-[10px] px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-600 rounded-full font-mono font-bold animate-pulse">
                    Slot Conflict Detected!
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Official D&D 3.5e Dungeon Master's Guide p. 214 — Body Slot Limits & Non-Stacking Rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto font-sans flex-1">
          {bodyUsage.hasConflicts && (
            <div className="p-3 bg-rose-950/60 border border-rose-600/70 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-rose-100">DMG p. 214 Body Slot Limit Violation:</strong>
                A humanoid character may only wear one item of a given body slot (except two rings). If a second item is put on in that slot, neither functions until one is removed! Unequip conflicting items below to resolve.
              </div>
            </div>
          )}

          {/* Body Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bodyUsage.slots.map((slotData: Dnd35eBodySlotOccupant) => {
              const isOccupied = !!slotData.equippedItem;
              const hasConflict = slotData.conflictingItems.length > 0;

              return (
                <div
                  key={slotData.slot.key}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                    hasConflict
                      ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950'
                      : isOccupied
                      ? 'bg-stone-950 border-sky-700/60 shadow-sm'
                      : 'bg-stone-950/50 border-stone-800 text-stone-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold font-serif ${isOccupied ? 'text-sky-300' : 'text-stone-400'}`}>
                          {slotData.slot.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        hasConflict
                          ? 'bg-rose-900 text-rose-200 font-bold'
                          : isOccupied
                          ? 'bg-sky-950 text-sky-300 font-bold border border-sky-800'
                          : 'bg-stone-900 text-stone-500'
                      }`}>
                        {hasConflict ? 'CONFLICT (2+)' : isOccupied ? 'Occupied' : 'Empty'}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-400 mb-2 leading-relaxed">
                      {slotData.slot.description}
                    </p>

                    {/* Primary Equipped Item in this Slot */}
                    {slotData.equippedItem ? (
                      <div className="bg-stone-900 p-2 rounded-lg border border-stone-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-stone-200 block truncate">
                            {slotData.equippedItem.name}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {slotData.equippedItem.weight} lbs &bull; {slotData.equippedItem.itemType || 'Gear'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnequipItem(slotData.equippedItem!.id)}
                          className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[10px] font-mono font-bold transition shrink-0 cursor-pointer"
                        >
                          Unequip
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-stone-600 italic py-1">
                        No item equipped in this slot
                      </div>
                    )}

                    {/* Conflicting Items in this slot */}
                    {hasConflict && (
                      <div className="mt-2 space-y-1.5 pt-1.5 border-t border-rose-900/60">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide block">
                          Conflicting Items (Wearing multiple):
                        </span>
                        {slotData.conflictingItems.map(item => (
                          <div key={item.id} className="bg-rose-950/60 border border-rose-800/80 p-1.5 rounded-lg flex items-center justify-between gap-1.5 text-xs">
                            <span className="text-rose-200 font-bold truncate text-[11px]">{item.name}</span>
                            <button
                              type="button"
                              onClick={() => handleUnequipItem(item.id)}
                              className="px-1.5 py-0.5 bg-rose-900 hover:bg-rose-800 text-rose-100 rounded text-[9px] font-mono font-bold transition shrink-0 cursor-pointer"
                            >
                              Unequip
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-stone-800/60 text-[9.5px] text-stone-500 font-mono">
                    Examples: {slotData.slot.examples.join(', ')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reference Info Card */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-start gap-2.5 text-xs text-stone-400">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sky-300 block mb-0.5">D&D 3.5e Body Slot Affinities & Rules (DMG p. 214):</strong>
              Most magic items are designed to fit one of these specific anatomical body locations. While a character may carry an unlimited amount of unequipped gear within their carrying capacity, only items occupying approved, non-conflicting body slots grant their magical enchantments and AC benefits.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
