import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eRangerStats,
  DND35E_OFFICIAL_FAVORED_ENEMIES
} from '../../utils/calculators/classFeatures35eCalculators';
import { Crosshair, Target, Shield, X, Plus, Trash2, Award } from 'lucide-react';
import { playDiceSound } from '../../utils/soundEffects';

interface FavoredEnemy35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (char: CharacterData) => void;
  onClose: () => void;
}

export const FavoredEnemy35eModal: React.FC<FavoredEnemy35eModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose
}) => {
  if (!isOpen) return null;

  const stats = calculate35eRangerStats(character);
  const [selectedEnemyToAdd, setSelectedEnemyToAdd] = useState<string>(DND35E_OFFICIAL_FAVORED_ENEMIES[0]);
  const [logMessage, setLogMessage] = useState<string | null>(null);

  const handleAddEnemy = () => {
    const current = character.favoredEnemies35e || [];
    if (current.some(e => e.category === selectedEnemyToAdd)) {
      setLogMessage('⚠️ This favored enemy category is already chosen! Use the + button to increase its bonus.');
      return;
    }

    const updated = [...current, { category: selectedEnemyToAdd, bonus: 2 }];
    onUpdateCharacter({
      ...character,
      favoredEnemies35e: updated
    });

    playDiceSound();
    setLogMessage(`🏹 Added ${selectedEnemyToAdd} as a Favored Enemy (+2 bonus to Bluff, Listen, Sense Motive, Spot, Survival, and damage rolls).`);
  };

  const handleAdjustBonus = (category: string, delta: number) => {
    const current = character.favoredEnemies35e || [];
    const updated = current.map(e => {
      if (e.category === category) {
        const nextBonus = Math.max(2, e.bonus + delta);
        return { ...e, bonus: nextBonus };
      }
      return e;
    });

    onUpdateCharacter({
      ...character,
      favoredEnemies35e: updated
    });
  };

  const handleRemoveEnemy = (category: string) => {
    const current = character.favoredEnemies35e || [];
    onUpdateCharacter({
      ...character,
      favoredEnemies35e: current.filter(e => e.category !== category)
    });
  };

  const handleToggleCombatStyle = (style: 'archery' | 'two_weapon') => {
    onUpdateCharacter({
      ...character,
      rangerCombatStyle: style
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-stone-900 border border-amber-600/50 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-200">
                D&D 3.5e Favored Enemy & Combat Style
              </h2>
              <p className="text-xs text-stone-400">
                PHB p. 47 • Level {stats.rangerLevel} Ranger ({stats.favoredEnemies.length}/{stats.totalFavoredEnemiesAllowed} Favored Enemies)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 py-4 overflow-y-auto">
          {logMessage && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200">
              {logMessage}
            </div>
          )}

          {/* Combat Style Selector */}
          <div className="p-3.5 bg-stone-950/70 border border-stone-800 rounded-xl space-y-2">
            <span className="text-xs font-serif font-bold text-amber-200 block">
              Combat Style Track (Lvl 2+ Feats Granted):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleCombatStyle('archery')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left ${
                  stats.combatStyle === 'archery'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : 'bg-stone-950/50 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-serif">
                  <span>🏹</span> Archery Path
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  Rapid Shot • Manyshot • Imp. Precise Shot
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleCombatStyle('two_weapon')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left ${
                  stats.combatStyle === 'two_weapon'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : 'bg-stone-950/50 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-serif">
                  <span>⚔️</span> Two-Weapon Fighting Path
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  TWF • Improved TWF • Greater TWF
                </div>
              </button>
            </div>
          </div>

          {/* Favored Enemies List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-amber-200">
                Active Favored Enemies:
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                Applies to: Bluff, Listen, Sense Motive, Spot, Survival & Weapon Damage
              </span>
            </div>

            <div className="space-y-2">
              {stats.favoredEnemies.map((enemy) => (
                <div
                  key={enemy.category}
                  className="p-3 bg-stone-950/50 border border-stone-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-amber-300 text-sm">
                      {enemy.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono font-bold">
                      +{enemy.bonus} Bonus
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustBonus(enemy.category, -2)}
                      className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-mono font-bold"
                    >
                      -2
                    </button>
                    <button
                      onClick={() => handleAdjustBonus(enemy.category, 2)}
                      className="px-2 py-0.5 bg-amber-700 hover:bg-amber-600 text-white rounded font-mono font-bold"
                    >
                      +2
                    </button>
                    <button
                      onClick={() => handleRemoveEnemy(enemy.category)}
                      className="p-1 text-stone-500 hover:text-rose-400 transition"
                      title="Remove enemy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Favored Enemy Form */}
            <div className="pt-2 flex items-center gap-2">
              <select
                value={selectedEnemyToAdd}
                onChange={(e) => setSelectedEnemyToAdd(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              >
                {DND35E_OFFICIAL_FAVORED_ENEMIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddEnemy}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Add Enemy
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
