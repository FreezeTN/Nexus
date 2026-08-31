import React from 'react';
import { CharacterData } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import {
  getCarryingCapacity,
  getTotalWeight,
  getEncumbranceDetails,
  getWeightBreakdown
} from '../../../utils/dndCalculations';
import { getContainerWeightSummaries } from '../../../utils/containerUtils';
import { Weight, ShieldAlert, Scale, Sparkles, Coins, Package, Check, Info } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

interface EncumbranceCapacityPanelProps {
  character: CharacterData;
  onUpdateCharacter?: (updated: CharacterData) => void;
}

export const EncumbranceCapacityPanel: React.FC<EncumbranceCapacityPanelProps> = ({
  character,
  onUpdateCharacter
}) => {
  const { t } = useLanguage();
  const carryingCap = getCarryingCapacity(character);
  const totalWeight = getTotalWeight(character);
  const encumbrance = getEncumbranceDetails(character);
  const weightBreakdown = getWeightBreakdown(character);
  const containerSummaries = getContainerWeightSummaries(character);

  const isEncumbered = encumbrance.status !== 'Normal';
  const isCoinWeightActive = character.optionalRules?.includeCoinWeight ?? true;

  const toggleCoinWeight = () => {
    if (!onUpdateCharacter) return;
    onUpdateCharacter({
      ...character,
      optionalRules: {
        ...character.optionalRules,
        includeCoinWeight: !isCoinWeightActive
      }
    });
  };

  const penaltyDescription = `Speed Penalty: -${encumbrance.speedPenalty} ft${encumbrance.hasDisadvantage ? ' & Disadvantage on physical checks/saves' : ''}`;
  const weightPercentage = Math.min(100, Math.round((totalWeight / (carryingCap || 1)) * 100));

  return (
    <CollapsibleBox
      title={t('inventory.carryingCapacity', 'Carrying Capacity & Encumbrance Rules')}
      icon={<Weight className="w-5 h-5 text-amber-500" />}
      storageKey="sheet3_encumbrance"
      headerExtra={
        <div className="flex items-center gap-2">
          {weightBreakdown.extradimensionalWeight > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/40">
              <Sparkles className="w-3 h-3 text-purple-400" />
              -{weightBreakdown.extradimensionalWeight.toFixed(1)} lbs absorbed
            </span>
          )}
          <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
            isEncumbered
              ? 'bg-rose-950 text-rose-300 border-rose-600/60 animate-pulse'
              : 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
          }`}>
            {encumbrance.status} ({totalWeight.toFixed(1)} / {carryingCap} lbs)
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-2 text-xs font-mono">
        {/* Weight Progress Bar */}
        <div className="space-y-1.5 bg-stone-950 p-3.5 rounded-xl border border-stone-800">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              Weight Carried: <strong className="text-amber-200">{totalWeight.toFixed(1)} lbs</strong>
              <span className="text-[10px] text-stone-500">({weightPercentage}% cap)</span>
            </span>
            <span>Max Capacity: <strong className="text-stone-200">{carryingCap} lbs</strong></span>
          </div>

          <div className="w-full h-3.5 bg-stone-900 rounded-full border border-stone-800 overflow-hidden relative shadow-inner">
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

          <div className="flex items-center justify-between text-[10px] text-stone-500 pt-0.5">
            <span>0 lbs (Light)</span>
            <span>{Math.round(carryingCap / 3)} lbs (Encumbered threshold)</span>
            <span>{carryingCap} lbs (Max Push/Drag/Lift: {carryingCap * 2} lbs)</span>
          </div>
        </div>

        {/* Encumbrance Details Warning */}
        {isEncumbered && (
          <div className="bg-rose-950/60 border border-rose-600/50 p-3 rounded-xl flex items-center gap-2 text-rose-200 text-xs">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="block font-sans font-bold">Encumbrance Penalty Active!</strong>
              <p className="text-[11px] text-rose-300 font-sans">{penaltyDescription}</p>
            </div>
          </div>
        )}

        {/* Weight Distribution Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <span className="text-stone-500 block text-[9px] uppercase">{t('inventory.equipped', 'Equipped Gear')}</span>
            <span className="font-bold text-amber-300">{weightBreakdown.equippedWeight.toFixed(1)} lbs</span>
          </div>
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <span className="text-stone-500 block text-[9px] uppercase">Carried / Bags</span>
            <span className="font-bold text-stone-200">{weightBreakdown.carriedWeight.toFixed(1)} lbs</span>
          </div>
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 relative group">
            <span className="text-stone-500 block text-[9px] uppercase flex items-center justify-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" />
              Coin Weight
            </span>
            <span className={`font-bold ${isCoinWeightActive ? 'text-amber-400' : 'text-stone-500 line-through'}`}>
              {weightBreakdown.coinWeight.toFixed(1)} lbs
            </span>
            {onUpdateCharacter && (
              <button
                type="button"
                onClick={toggleCoinWeight}
                className="mt-1 text-[9px] px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 block mx-auto transition"
                title="Toggle D&D 5e Variant 50 coins = 1 lb rule"
              >
                {isCoinWeightActive ? 'Active (50/lb)' : 'Off (0 lbs)'}
              </button>
            )}
          </div>
          <div className="bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/40">
            <span className="text-purple-300 block text-[9px] uppercase flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Extradimensional
            </span>
            <span className="font-bold text-purple-300">
              {weightBreakdown.extradimensionalWeight.toFixed(1)} lbs
            </span>
            <span className="block text-[8px] text-purple-400/80">0 lbs added to load</span>
          </div>
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <span className="text-stone-500 block text-[9px] uppercase">Stored (Camp/Stash)</span>
            <span className="font-bold text-stone-400">{weightBreakdown.storedWeight.toFixed(1)} lbs</span>
            <span className="block text-[8px] text-stone-500">Not on person</span>
          </div>
        </div>

        {/* Active Containers & Bags Summary */}
        {containerSummaries.containers.length > 0 && (
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-sans font-bold text-stone-300 border-b border-stone-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                Active Containers & Bag Capacities
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                {containerSummaries.containers.length} container{containerSummaries.containers.length > 1 ? 's' : ''} configured
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {containerSummaries.containers.map(({ container, items, currentWeightLbs, isOverCapacity, effectiveCarriedContributionLbs }) => (
                <div
                  key={container.id}
                  className={`p-2 rounded-lg border text-[11px] space-y-1 ${
                    container.isExtradimensional
                      ? 'bg-purple-950/20 border-purple-800/40 text-purple-200'
                      : 'bg-stone-900/80 border-stone-800 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="font-sans text-xs truncate">{container.name}</strong>
                    {container.isExtradimensional && (
                      <span className="text-[9px] bg-purple-900/60 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/40">
                        Magic Space
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                    <span>Contents: {currentWeightLbs} / {container.capacityLbs} lbs</span>
                    <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className={`h-full ${
                        isOverCapacity
                          ? 'bg-rose-500'
                          : container.isExtradimensional
                            ? 'bg-purple-500'
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (currentWeightLbs / container.capacityLbs) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-stone-400 font-sans flex items-center justify-between">
                    <span>Bearer load: <strong className="text-amber-300">{effectiveCarriedContributionLbs} lbs</strong></span>
                    {isOverCapacity && <span className="text-rose-400 font-bold">⚠️ Overloaded!</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleBox>
  );
};
