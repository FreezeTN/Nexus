import React from 'react';
import { CharacterData } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { getTotalWealthInGold } from '../../../utils/dndCalculations';
import { Coins, Gem } from 'lucide-react';

interface WealthCurrencyPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const WealthCurrencyPanel: React.FC<WealthCurrencyPanelProps> = ({
  character,
  onUpdateCharacter
}) => {
  const handleCurrencyChange = (coinType: keyof CharacterData['wealth'], value: number) => {
    onUpdateCharacter({
      ...character,
      wealth: {
        ...character.wealth,
        [coinType]: Math.max(0, value)
      }
    });
  };

  const totalWealthGold = getTotalWealthInGold(character);

  return (
    <CollapsibleBox
      title="Wealth, Currency & Trade Goods"
      icon={<Coins className="w-5 h-5 text-amber-500" />}
      storageKey="sheet3_wealth"
      headerExtra={
        <div className="text-xs font-mono text-amber-300 font-bold bg-amber-950/80 border border-amber-600/50 px-2.5 py-1 rounded-lg">
          Total Net Worth: ~{totalWealthGold.toLocaleString(undefined, { maximumFractionDigits: 2 })} GP
        </div>
      }
    >
      <div className="space-y-4 pt-2 text-xs">
        {/* Coin Pouch Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
          {/* Copper (CP) */}
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex flex-col items-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase mb-1">Copper (CP)</span>
            <input
              type="number"
              min="0"
              value={character.wealth?.cp || 0}
              onChange={(e) => handleCurrencyChange('cp', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-stone-700 rounded text-center text-amber-600 font-bold p-1 text-sm"
            />
            <span className="text-[9px] text-stone-500 mt-1">100 CP = 1 GP</span>
          </div>

          {/* Silver (SP) */}
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-300 uppercase mb-1">Silver (SP)</span>
            <input
              type="number"
              min="0"
              value={character.wealth?.sp || 0}
              onChange={(e) => handleCurrencyChange('sp', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-stone-700 rounded text-center text-slate-200 font-bold p-1 text-sm"
            />
            <span className="text-[9px] text-stone-500 mt-1">10 SP = 1 GP</span>
          </div>

          {/* Electrum (EP) */}
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex flex-col items-center">
            <span className="text-[10px] font-bold text-sky-400 uppercase mb-1">Electrum (EP)</span>
            <input
              type="number"
              min="0"
              value={character.wealth?.ep || 0}
              onChange={(e) => handleCurrencyChange('ep', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-stone-700 rounded text-center text-sky-300 font-bold p-1 text-sm"
            />
            <span className="text-[9px] text-stone-500 mt-1">2 EP = 1 GP</span>
          </div>

          {/* Gold (GP) */}
          <div className="bg-stone-950 p-2.5 rounded-xl border border-amber-600/40 flex flex-col items-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase mb-1">Gold (GP)</span>
            <input
              type="number"
              min="0"
              value={character.wealth?.gp || 0}
              onChange={(e) => handleCurrencyChange('gp', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-amber-600/60 rounded text-center text-amber-300 font-bold p-1 text-sm"
            />
            <span className="text-[9px] text-stone-500 mt-1">Standard Currency</span>
          </div>

          {/* Platinum (PP) */}
          <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex flex-col items-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-purple-300 uppercase mb-1">Platinum (PP)</span>
            <input
              type="number"
              min="0"
              value={character.wealth?.pp || 0}
              onChange={(e) => handleCurrencyChange('pp', parseInt(e.target.value) || 0)}
              className="w-full bg-stone-900 border border-stone-700 rounded text-center text-purple-200 font-bold p-1 text-sm"
            />
            <span className="text-[9px] text-stone-500 mt-1">1 PP = 10 GP</span>
          </div>
        </div>
      </div>
    </CollapsibleBox>
  );
};
