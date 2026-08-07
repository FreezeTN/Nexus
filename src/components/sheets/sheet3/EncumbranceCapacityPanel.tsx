import React from 'react';
import { CharacterData } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import {
  getCarryingCapacity,
  getTotalWeight,
  getEncumbranceDetails,
  getWeightBreakdown
} from '../../../utils/dndCalculations';
import { Weight, ShieldAlert, Scale } from 'lucide-react';

interface EncumbranceCapacityPanelProps {
  character: CharacterData;
}

export const EncumbranceCapacityPanel: React.FC<EncumbranceCapacityPanelProps> = ({
  character
}) => {
  const carryingCap = getCarryingCapacity(character);
  const totalWeight = getTotalWeight(character);
  const encumbrance = getEncumbranceDetails(character);
  const weightBreakdown = getWeightBreakdown(character);

  const weightPercentage = Math.min(100, Math.round((totalWeight / (carryingCap || 1)) * 100));

  return (
    <CollapsibleBox
      title="Carrying Capacity & Encumbrance Rules"
      icon={<Weight className="w-5 h-5 text-amber-500" />}
      storageKey="sheet3_encumbrance"
      headerExtra={
        <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
          encumbrance.isEncumbered
            ? 'bg-rose-950 text-rose-300 border-rose-600/60 animate-pulse'
            : 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
        }`}>
          {encumbrance.statusText} ({totalWeight.toFixed(1)} / {carryingCap} lbs)
        </div>
      }
    >
      <div className="space-y-4 pt-2 text-xs font-mono">
        {/* Weight Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>Weight Carried: <strong className="text-amber-200">{totalWeight.toFixed(1)} lbs</strong></span>
            <span>Max Capacity: <strong className="text-stone-200">{carryingCap} lbs</strong></span>
          </div>

          <div className="w-full h-3 bg-stone-950 rounded-full border border-stone-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-300 ${
                weightPercentage > 100
                  ? 'bg-rose-600'
                  : weightPercentage > 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, weightPercentage)}%` }}
            />
          </div>
        </div>

        {/* Encumbrance Details */}
        {encumbrance.isEncumbered && (
          <div className="bg-rose-950/60 border border-rose-600/50 p-3 rounded-xl flex items-center gap-2 text-rose-200 text-xs">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="block font-sans font-bold">Encumbrance Penalty Active!</strong>
              <p className="text-[11px] text-rose-300 font-sans">{encumbrance.penaltyDescription}</p>
            </div>
          </div>
        )}

        {/* Weight Distribution Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
          <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
            <span className="text-stone-500 block text-[9px] uppercase">Equipped Gear</span>
            <span className="font-bold text-amber-300">{weightBreakdown.equippedWeight.toFixed(1)} lbs</span>
          </div>
          <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
            <span className="text-stone-500 block text-[9px] uppercase">Carried / Inventory</span>
            <span className="font-bold text-stone-200">{weightBreakdown.backpackWeight.toFixed(1)} lbs</span>
          </div>
          <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
            <span className="text-stone-500 block text-[9px] uppercase">Coin Weight</span>
            <span className="font-bold text-stone-300">{weightBreakdown.coinWeight.toFixed(1)} lbs</span>
          </div>
          <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
            <span className="text-stone-500 block text-[9px] uppercase">Stored Away (Stash)</span>
            <span className="font-bold text-stone-400">{weightBreakdown.storedWeight.toFixed(1)} lbs</span>
          </div>
        </div>
      </div>
    </CollapsibleBox>
  );
};
