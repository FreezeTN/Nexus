import React, { useState } from 'react';
import { 
  Dices, 
  Heart, 
  Swords, 
  ShieldAlert, 
  ChevronUp, 
  ChevronDown, 
  Zap
} from 'lucide-react';
import { CharacterData, RuleEdition } from '../../types';
import { getEffectiveMaxHp, getProficiencyBonus, formatModifier } from '../../utils/dndCalculations';

interface FloatingQuickPlayDockProps {
  character: CharacterData;
  edition?: RuleEdition;
  onUpdateCharacter: (char: CharacterData) => void;
  onRollDice?: (formula?: string) => void;
  onRollInitiative?: () => void;
  onOpenCommandPalette?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const FloatingQuickPlayDock: React.FC<FloatingQuickPlayDockProps> = ({
  character,
  edition = '5e',
  onUpdateCharacter,
  onRollDice,
  onRollInitiative,
  onOpenCommandPalette,
  onNavigateTab
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickHpVal, setQuickHpVal] = useState('');

  if (!character) return null;

  const maxHp = getEffectiveMaxHp(character);
  const hpPct = Math.max(0, Math.min(100, Math.round((character.hpCurrent / Math.max(1, maxHp)) * 100)));

  const handleAdjustHp = (delta: number) => {
    let newHp = character.hpCurrent;
    let newTemp = character.hpTemp || 0;

    if (delta > 0) {
      newHp = Math.min(maxHp, newHp + delta);
    } else {
      const dmg = Math.abs(delta);
      if (newTemp > 0) {
        if (dmg <= newTemp) {
          newTemp -= dmg;
        } else {
          const rem = dmg - newTemp;
          newTemp = 0;
          newHp = Math.max(0, newHp - rem);
        }
      } else {
        newHp = Math.max(0, newHp - dmg);
      }
    }

    onUpdateCharacter({
      ...character,
      hpCurrent: newHp,
      hpTemp: newTemp
    });
    setQuickHpVal('');
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none pointer-events-auto">
      {/* Expanded Quick Drawer */}
      {isExpanded && (
        <div className="mb-2 bg-stone-900/95 border border-amber-600/50 rounded-2xl shadow-2xl p-3 backdrop-blur-md text-stone-100 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Quick HP Adjustment */}
          <div className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1.5 rounded-xl border border-stone-800">
            <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-[11px] font-mono font-bold text-stone-300">
              HP {character.hpCurrent}/{maxHp}
            </span>
            <input
              type="number"
              value={quickHpVal}
              onChange={(e) => setQuickHpVal(e.target.value)}
              placeholder="Amt"
              className="w-12 bg-stone-800 border border-stone-700 text-center font-mono text-xs py-0.5 rounded text-amber-200 focus:outline-none"
            />
            <button
              onClick={() => {
                const val = parseInt(quickHpVal, 10);
                if (!isNaN(val) && val > 0) handleAdjustHp(val);
              }}
              className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-stone-100 font-bold text-xs rounded transition"
              title="Heal HP"
            >
              +
            </button>
            <button
              onClick={() => {
                const val = parseInt(quickHpVal, 10);
                if (!isNaN(val) && val > 0) handleAdjustHp(-val);
              }}
              className="px-2 py-0.5 bg-rose-700 hover:bg-rose-600 text-stone-100 font-bold text-xs rounded transition"
              title="Damage HP"
            >
              -
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            {onRollInitiative && (
              <button
                onClick={onRollInitiative}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                title="Roll Initiative"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Init ({formatModifier(character.initiativeBonus)})</span>
              </button>
            )}

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('sheet2')}
                className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-rose-600/40 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                title="Open Combat Sheet"
              >
                <Swords className="w-3.5 h-3.5 text-rose-400" />
                <span>Combat</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Pill Bar */}
      <div className="bg-stone-900/95 border border-amber-600/60 shadow-2xl rounded-full px-3.5 py-1.5 flex items-center gap-3 backdrop-blur-md text-stone-100 ring-1 ring-black/40">
        {/* Character Avatar & Name */}
        <div className="flex items-center gap-2 pr-2 border-r border-stone-800">
          <div className="w-6 h-6 rounded-full bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center font-mono shrink-0 shadow-sm">
            {character.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-stone-200 truncate max-w-[90px] sm:max-w-[120px]">
            {character.name}
          </span>
        </div>

        {/* Compact HP Meter */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition pr-2 border-r border-stone-800"
          title="Click to open Quick HP Adjustment"
        >
          <div className="w-14 bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
            <div
              className={`h-full transition-all duration-300 ${
                hpPct > 50 ? 'bg-emerald-500' : hpPct > 20 ? 'bg-amber-500' : 'bg-rose-600'
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-amber-200">
            {character.hpCurrent}
          </span>
        </div>

        {/* Quick Roll D20 Button */}
        <button
          onClick={() => onRollDice ? onRollDice('1d20') : null}
          className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 px-2 py-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          title="Roll 1d20"
        >
          <Dices className="w-4 h-4 text-amber-400" />
          <span className="font-mono">d20</span>
        </button>

        {/* Expand / Collapse Toggle Arrow */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          title={isExpanded ? 'Collapse Quick Actions' : 'Expand Quick Actions'}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
